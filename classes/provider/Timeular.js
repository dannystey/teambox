var https = require('https');
var leadingZeros = require('./../helpers/LeadingZerosHelper');

class Timeular {
    constructor() {
        this.apiKey = 'NTg5NzFfZDYwZWZiYTAxYmY5NDgzMWE0MTJjZGVhZGQ0NTVlNjM=';
        this.apiSecret = 'MjZmY2NkMTVhODE5NDAxMDkyMmYzZTBiNTVkZTM3NDA=';
    }

    getActivities() {
        console.log('. get activities form timular');
        this.getToken().then((token) => {
            console.log('. request activities with token');
            this.call('GET', '/activities', {}, token).then((response) => {
                console.log(response)
            })
            .catch((e) => console.error(e))
        })
    }

    getTimeEntries(year, month, day) {
        return new Promise((resolve, reject) => {
            // /time-entries/{stoppedAfter}/{startedBefore}
            const startDay = new Date(year, month-1, day, 0, 0, 0);
            const startTime = `${startDay.getFullYear()}-${leadingZeros(startDay.getMonth() +1)}-${leadingZeros(startDay.getDate())}T00:00:00.000`
            const endTime = `${startDay.getFullYear()}-${leadingZeros(startDay.getMonth() +1)}-${leadingZeros(startDay.getDate())}T23:59:59.999`

            console.log('. get time entries form timular', startTime, endTime);
            this.getToken().then((token) => {
                console.log('. request time-entries with token');
                this.call('GET', `/time-entries/${startTime}/${endTime}`, {}, token).then((response) => {
                    resolve(this.format(response.timeEntries));
                })
                .catch((e) => reject(e))
            })
        })
        
    } 

    format(timeEntries) {
        let formatedResult = [];
        timeEntries.forEach((entry) => {
            const info = entry.note.text.split('|')
            if(info.length < 3) {
                console.log("\x1b[31m", `not a valid format for the entry ${entry.activity.name}! please write in the note field <JOB_NR>|<PHASE>|<ACTIVITY>|<DESC>`)
                return true;
            }
            formatedResult.push({
                job_nr: info[0],
                phase: info[1] || null,
                activity: info[2] || null,
                info: info[3] || null,
                duration: new Date(entry.duration.stoppedAt).getTime() - new Date(entry.duration.startedAt).getTime() 
            })
        })
        return formatedResult
    }

    getToken() {
        return new Promise((resolve, reject) => {
            // https://api.timeular.com/api/v2/developer/sign-in
            const jsonData = {
                apiKey: this.apiKey,
                apiSecret: this.apiSecret
            }
            console.log('. requesting token!')
            this.call('POST', '/developer/sign-in', jsonData).then((response) => {
                console.log('. got token!');
                resolve(response.token)
            })
            .catch((e) => reject(e))
            
        });
    }

    call(method, path, data, token) {
        return new Promise((resolve, reject) => {
            let auth = {};
            if(token) { 
                auth = { Authorization: 'Bearer ' + token }
            }             
            const req = https.request({
                hostname: 'api.timeular.com',
                port: 443,
                path: '/api/v2/' + path,
                method: method,
                headers: {
                    'Content-Length': JSON.stringify(data).length,
                    'Content-type': 'application/json; charset=UTF-8',
                    ...auth
                } 
            }, (res) => {
                let body = '';
                res.on('data', function(data) {
                    body += data;
                });
                res.on('end', function() {
                    const response = JSON.parse(body);
                    resolve(response);
                })
            })
            req.on('error', (error) => {
                console.error(error);
                reject();
            })
            if(data) {
                req.write(JSON.stringify(data))
            }
            req.end();
        })
    } 
}
module.exports = Timeular;