var https = require('https');
var serialize = require('./SerializeHelper');

class RPCDriver {
    constructor() {
        return new Promise((resolve, reject) => {
            this.getAuth(resolve, reject);
        })
        
    }
    getAuth(resolve, reject) {
        const formData = serialize({
            'auth_user': process.env.USERNAME,
            'auth_pwd': process.env.PASSWORD,
            'auth_language': 'de'
        });

        const options = {
            hostname: process.env.ENDPOINT,
            port: 443,
            path: '/app/auth/login',
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(process.env.USERNAME + ':' + process.env.PASSWORD).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': formData.length
            } 
        }

        const req = https.request(options, (res) => {
            resolve(res['headers']['set-cookie']);
        });

        req.on('error', (e) => {
            console.error(e);
            reject();
        });
        
        req.write(formData);
        req.end();

    }
}

module.exports = RPCDriver;