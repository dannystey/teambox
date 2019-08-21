var https = require('https');

class ByeCommand {
    static command() {
        return ' bye';
    }

    run(withList, withMonth) {
        this.callEmployees();
    }

    callEmployees(withList, withMonth) {
        const options = {
            hostname: process.env.ENDPOINT,
            port: 443,
            path: '/rest/employee.json',
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
                console.log("\x1b[35m", '👋  say bye to:')

                data.result.filter((employee) => {
                    return employee.austritt;
                }).forEach((employee) => {
                    if(employee.id == process.env.MAID) {
                        console.log("\x1b[31m", employee.austritt, "💣  \t --- \t ", employee.fullname ) 
                    }
                    else if(new Date(employee.austritt.split('-')[0], parseInt(employee.austritt.split('-')[1])-1 ,employee.austritt.split('-')[2]) > new Date) {

                        console.log("\x1b[35m", employee.austritt, "☠️  \t --- \t ", employee.fullname ) 
                    }
                    else {
                        //console.log("\x1b[36m", employee.austritt, "  \t --- \t ", employee.fullname ) 
                    }
                })
             });
        })
        req.on('error', (error) => {
            console.error(error)
        })
        req.end();
    }
}
module.exports = ByeCommand;