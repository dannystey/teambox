var fs = require('fs');
var ErrorController = require('../ErrorController');

class IgnoreCommand {

    command() {
        return 'ignore [ls|]';
    }

    run(rootPath) {
        this.rootPath = rootPath;
        const index = 3;
        let action = process.argv[index];
        let content;
        content = fs.readFileSync(rootPath + '/.env', 'utf-8');
        let val = content.match(/EXCLUDEDAYS=(.+)/);
        
        let dates = val && val[1] ? val[1].split(',') : [];
        switch(action) {
            case 'ls':
                dates.forEach((d) => console.log(d));
                break;
            case 'add':
                let newDate = process.argv[index + 1];
                dates.push(newDate);
                this.save(dates);
                break;
            case 'rm':
                let rmDate = process.argv[index + 1];
                this.save(dates.filter((date) => rmDate !== date));
                break;
        }
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
            console.error('please register the teambox first!');
            process.exit(1);
        }

    }

}


module.exports = IgnoreCommand;