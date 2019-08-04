var https = require('https');
var serialize = require('../helpers/SerializeHelper');
module.exports = (method, path, data = {}, type = 'json') => {
    return new Promise((resolve, reject) => {
        let additionalHeaders ={}
        if(type == 'formdata') {
            additionalHeaders = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': serialize(data).length
            }
        }

        if(type == 'json') {
            additionalHeaders = {
                'Content-Length': JSON.stringify(data).length,
                'Content-type': 'application/json; charset=UTF-8',
            }
        }
        
        const req = https.request({
            hostname: process.env.ENDPOINT,
            port: 443,
            path: path,
            method: method,
            headers: {
                'Authorization': 'Basic ' + Buffer.from(process.env.USERNAME + ':' + process.env.PASSWORD).toString('base64'),
                ...additionalHeaders
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
            req.write(type == 'json' ? JSON.stringify(data) : serialize(data))
        }
        req.end();
    })
} 