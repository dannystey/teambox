var fs = require('fs');
var ErrorController = require('../ErrorController');

class IgnoreCommand {

    command() {
        return 'transfer <PROVIDER>';
    }

    run() {
        
    }

    save(dates) {
        let datesStr = dates.join(',');
        let content = fs.readFileSync(this.rootPath + '/.env', 'utf-8');
        content = content.replace(/(EXCLUDEDAYS=)(.*)/mg, `$1${datesStr}`);
        if(fs.existsSync(this.rootPath + '/.env')) {
            fs.writeFile(this.rootPath + '/.env', content, { encoding: 'utf8' }, (err) => {
                if(err) {
                    console.error(err);
                    process.exit(1);
                }
                console.log('done!');
                process.exit();
            });
        }
        else {
            console.log('please register the teambox first!');
        }

    }

}


module.exports = IgnoreCommand;