var fs = require('fs');
var ErrorController = require('./../ErrorController');

class RegisterCommand {

    command() {
        return 'register <DOMAIN> <MAID> <USERNAME> <PASSWORD> [force]';
    }

    run(rootPath, storagePath) {
        if (!fs.existsSync(storagePath)){
            fs.mkdirSync(storagePath);
        }
        const index = 2;
        const domain = process.argv[index+1] || null;
        const maid = process.argv[index+2] || null;
        const user = process.argv[index+3] || null;
        const password = process.argv[index+4] || null;
        const force = process.argv[index+5] && process.argv[index+5] === 'force' ? true : false;

        if(!domain || !user || !password || !maid) {
            ErrorController.trigger(this);
        }

        let content;
        content = fs.readFileSync(rootPath + '/.env.example', 'utf-8');
        content = content.replace(/(ENDPOINT=)([\d]*)/mg, `$1${domain}`);
        content = content.replace(/(MAID=)([\d]*)/mg, `$1${maid}`);
        content = content.replace(/(USERNAME=)([\d]*)/mg, `$1${user}`);
        content = content.replace(/(PASSWORD=)([\d]*)/mg, `$1${password}`);
        if(force || !fs.existsSync(storagePath + '/.env')) {
            console.log('writing env file!');
            fs.writeFile(storagePath + '/.env', content, { encoding: 'utf8' }, (err) => {
                if(err) {
                    console.error(err);
                    process.exit(1);
                }
                console.log('done!');
                process.exit();
            });
        }
        else {
            console.log('config already exists. maybe you have to force it.');
            ErrorController.trigger(this);
        }
    }

}


module.exports = RegisterCommand;