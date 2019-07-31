var https = require('https');
var parseDate = require('./../helpers/ParseDateHelper');
var leadingZeros = require('./../helpers/LeadingZerosHelper');
var serialize = require('./../helpers/SerializeHelper');

class StatisticCommand {
    static command() {
        return ' [month] ';
    }

    run() {
        this.callWorkData()
    }

    callWorkData() {
        let month = (new Date).getMonth() +1;
        let year = (new Date).getFullYear();

        const requestData = {
            _dc: '1564514147671',
            ma_id: process.env.MAID,
            tag: `${year}-${leadingZeros(month)}-01|${year}-${leadingZeros(parseInt(month)+1)}-01`
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
                this.calcWorkingDays(requestData.tag).then((workingdays) => {
                    // console.log(amounts, workingdays, Math.round(amounts.hours / workingdays.workingHours * 100) + '%')
                    console.log("\n🎱  --- 🎱  --- 🎱  --- 🎱  --- 🎱  --- 🎱  --- 🎱  --- 🎱  --- 🎱  --- 🎱  --- 🎱")
                    console.log(`📅  From:  ${workingdays.fromDate}`); 
                    console.log(`📅  To:    ${workingdays.toDate}`);
        
                    console.log("\x1b[90m",`
                        ____
                    ,dP9CGG88@b,
                  ,IP  _   Y888@@b,
                 dIi  (_)   G8888@b
                dCII  (_)   G8888@@b
                GCCIi     ,GG8888@@@
                GGCCCCCCCGGG88888@@@
                GGGGCCCGGGG88888@@@@...
                Y8GGGGGG8888888@@@@P.....
                 Y88888888888@@@@@P......
                 \`Y8888888@@@@@@@P'......
                    \`@@@@@@@@@P'.......
                        """"........
        
                    `)
        
                    const percent = Math.round(amounts.hours / workingdays.workingHours * 100);
        
                    let comment = 'Awesome!';
                    if(percent < 90) comment = 'Great! 🍺';
                    if(percent < 85) comment = 'Hey, almost reached the goal! 🏃‍'
                    if(percent < 80) comment = 'Hey, you are on the right path! 🚜'
                    if(percent < 70) comment = 'Come on! Increase your quote! 💣'
        
                    let color = "\x1b[32m";
                    if(percent < 85) color = "\x1b[33m";
                    if(percent < 70) color = "\x1b[31m";
        
                    console.log("\x1b[36m", `💰  Your hour costs ${Math.round(amounts.total/amounts.hours)} €`);
                    console.log("\x1b[32m", `💰  Your work is ${Math.round(amounts.total)} € worth`);
                    console.log(color, `🏆  You reached a billable quote of ${Math.round(amounts.hours / workingdays.workingHours * 100)}%! 🎱 ${comment}`);
                    console.log("\n🎱  --- 🎱  --- 🎱  --- 🎱  --- 🎱  --- 🎱  --- 🎱  --- 🎱  --- 🎱  --- 🎱  --- 🎱\n")
                
                })
             })
        })
        req.on('error', (error) => {
            console.error(error)
        })
        req.end();
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
    
    calcWorkingDays(tagQuery) {
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
                    if(date.getDay() > 1 && !mappedHolidays.includes(currentDate) && !excludeDays.split(',').includes(currentDate)) {
                        workingDays +=1;
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