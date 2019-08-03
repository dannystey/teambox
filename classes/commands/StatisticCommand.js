var https = require('https');
var parseDate = require('./../helpers/ParseDateHelper');
var leadingZeros = require('./../helpers/LeadingZerosHelper');
var serialize = require('./../helpers/SerializeHelper');
var RPCDriver = require('../helpers/RPCDriver');

class StatisticCommand {
    static command() {
        return ' [month <NUMBER> | list]';
    }

    run(withList, withMonth) {
        (new RPCDriver()).then((authCookies) => {
            this.authCookies = authCookies;
            this.currentIgnoredDays = [];
            this.callWorkData(withList, withMonth)
        });
    }

    callWorkData(withList, withMonth) {
        let month = withMonth || (new Date).getMonth() +1;
        let year = (new Date).getFullYear();

        const requestData = {
            _dc: '1564514147671',
            ma_id: process.env.MAID,
            tag: `${year}-${leadingZeros(month)}-01|${year}-${leadingZeros(parseInt(month)+1)}-01`,
            _sortfield: 'tag',
            _sortdir: 'ASC'
        };
        
        const options = {
            hostname: process.env.ENDPOINT,
            port: 443,
            path: '/rest/workdata.json?' + serialize(requestData),
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(process.env.USERNAME + ':' + process.env.PASSWORD).toString('base64')
            } 
        }
        
        const req = https.request(options, (res) => {
            // console.log(`workdata requested -> statusCode: ${res.statusCode}`)
          let body = '';
            res.on('data', function(data) {
                body += data;
             });
             res.on('end', () => {
              //here we have the full response, html or json object
                const data = JSON.parse(body);
                const amounts = this.getMoneyAmounts(data.result);
                this.getLeaveDays(requestData.tag).then((absences) => {
                    this.calcWorkingDays(requestData.tag, absences).then((workingdays) => {
                        // console.log(amounts, workingdays, Math.round(amounts.hours / workingdays.workingHours * 100) + '%')
                        console.log("\n-- -- -- -- -- -- -- \n")
                        console.log(`📅  From:  ${workingdays.fromDate}`); 
                        console.log(`📅  To:    ${workingdays.toDate}`);

                        const percent = Math.round(amounts.hours / workingdays.workingHours * 100);

                        let comment = 'Awesome! 🕺';
                        if(percent < 90) comment = 'Great! 🍺';
                        if(percent < 85) comment = 'Hey, almost reached the goal! 🏃‍'
                        if(percent < 80) comment = 'Hey, you are on the right path! 🚜'
                        if(percent < 70) comment = 'Come on! Increase your quote! 💣'

                        let color = "\x1b[32m";
                        if(percent < 85) color = "\x1b[33m";
                        if(percent < 70) color = "\x1b[31m";

                        console.log("\x1b[36m", `💰  Your hour costs ${Math.round(amounts.total/amounts.hours)} €`);
                        console.log("\x1b[32m", `💰  Your work is ${Math.round(amounts.total)} € worth`);
                        console.log(color, `🏆  You reached a booked quote of ${Math.round(amounts.hours / workingdays.workingHours * 100)}%! ${comment}`);
                        console.log("\n-- -- -- -- -- -- -- \n")

                        if(this.currentIgnoredDays.length) {
                            console.log("\x1b[36m", "IGNORED DAYS:")

                            this.currentIgnoredDays.forEach((day) => console.log('',day))

                            console.log("\n-- -- -- -- -- -- -- \n")
                        }

                        if(absences) {
                            console.log("\x1b[36m", "ABSENCE DAYS:")

                            Object.values(absences).forEach((day) => console.log('', `${day.date} - ${day.tooltip}`))

                            console.log("\n-- -- -- -- -- -- -- \n")
                        }
                        

                        if(withList) {
                            console.log("\n-- -- - LIST - -- -- \n")

                            this.getTasks().then((tasks) => {
                                let jobData = data.result.map((d) => {
                                    d.job = tasks.result.filter((t) => t.id === d.job_id)[0] || null;
                                    return d;
                                });

                                jobData.forEach((jD) => {
                                    let color = "\x1b[32m";
                                    if(jD.std < 2) color = "\x1b[33m";
                                    if(jD.std < 1) color = "\x1b[31m";
                                    console.log(color, `${(jD.tag)} | ${(jD.job ? jD.job.job_nr : null)} . ${(jD.job ? jD.job.bez : null)} : ${jD.std}h [${jD.info}]`, "\n")
                                });
                            });
                        }
                    });
                })
             })
        })
        req.on('error', (error) => {
            console.error(error)
        })
        req.end();
    }

    getTasks() {
        return new Promise ( (resolve, reject) => {
            const req = https.request({
                hostname: process.env.ENDPOINT,
                port: 443,
                path: '/rest/task.json?_sortfield=job_nr&_sortdir=ASC&jahr=%3E0&_limit=0&jobstatus%3Apermtime=1&aktiv=1',
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(process.env.USERNAME + ':' + process.env.PASSWORD).toString('base64')
                } 
            }, (res) => {
                let body = '';
                res.on('data', function(data) {
                    body += data;
                });
                res.on('end', function() {
                    const tasks = JSON.parse(body);
                    resolve(tasks);
                })
            })
            req.on('error', (error) => {
                console.error(error);
                reject();
            })
            req.end();
        })
    }

    getLeaveDays(tagQuery) {
        return new Promise ( (resolve, reject) => {
            const jsonData = [
                {
                    "action":"staff_leave",
                    "method":"getData",
                    "data":[
                        tagQuery,
                        0,
                        process.env.MAID,
                        1,
                        false
                    ],
                    "type":"rpc",
                    "tid":3
                }
            ];

            const req = https.request({
                hostname: process.env.ENDPOINT,
                port: 443,
                path: '/app/staff/leave/rpc',
                method: 'POST',
                
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(process.env.USERNAME + ':' + process.env.PASSWORD).toString('base64'),
                    'Content-Length': JSON.stringify(jsonData).length,
                    'Content-type': 'application/json; charset=UTF-8',
                    'Cookie': this.authCookies,
                } 
            }, (res) => {
                let body = '';
                res.on('data', function(data) {
                    body += data;
                });
                res.on('end', function() {
                    const absences = JSON.parse(body);
                    resolve(absences[0].result.data[0].days);
                })
            })
            req.on('error', (error) => {
                console.error(error);
                reject();
            })
            req.write(JSON.stringify(jsonData))
            req.end();
        })
    }
    
    getMoneyAmounts(data) {
        let total = 0;
        let earned = 0;
        let hours = 0;
        data.forEach((d) => {
            total += (d.amount || 0);
            if(d.abgerechnet) {
                earned += (d.amount || 0)
            }
            hours += d.std;
        });
        return {
            total,
            earned,
            hours
        };
    }
    
    calcWorkingDays(tagQuery, absences) {
        return new Promise((resolve, reject) => {
            this.getHolidays().then((holidays) => {
                const [from, to] = [...tagQuery.split('|')];
                const fromDate = parseDate(from);
                const toDate = parseDate(to);
                const date = fromDate;
                // console.log(fromDate, toDate);
            
                let workingDays = 0;
                const mappedHolidays = holidays.result.map((holiday) => {
                    return holiday.ftdate;
                });
                while(date < toDate) {
                    date.setDate(fromDate.getDate() + 1);
                    // check for working day
            
                    const currentDate = [date.getFullYear(), ('000' + (date.getUTCMonth()+1)).slice(-2), ('000' + date.getUTCDate()).slice(-2)].join('-');
                    const excludeDays = process.env.EXCLUDEDAYS || '';
                    if(date.getDay() > 1 && !mappedHolidays.includes(currentDate) && !excludeDays.split(',').includes(currentDate) && !Object.keys(absences).includes(currentDate)) {
                        workingDays +=1;
                    }
                    else if(excludeDays.split(',').includes(currentDate)) {
                        this.currentIgnoredDays.push(currentDate);
                    }
                }
            
                const workingHours = workingDays * process.env.WORKINGHOURS;
                
                resolve({ workingDays, workingHours, fromDate: parseDate(from), toDate })
            });
            
        });
    }
    
    getHolidays() {
        return new Promise ( (resolve, reject) => {
            const req = https.request({
                hostname: process.env.ENDPOINT,
                port: 443,
                path: '/rest/holiday.json?_dc=1564517471202',
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(process.env.USERNAME + ':' + process.env.PASSWORD).toString('base64')
                } 
            }, (res) => {
                // console.log(`holidays requested -> statusCode: ${res.statusCode}`)
            let body = '';
                res.on('data', function(data) {
                    body += data;
                });
                res.on('end', function() {
                    const holidays = JSON.parse(body);
                    resolve(holidays);
                })
            })
            req.on('error', (error) => {
                console.error(error);
                reject();
            })
            req.end();
        })
       
    }
}
module.exports = StatisticCommand;