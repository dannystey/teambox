var fs = require('fs');
var ErrorController = require('../ErrorController');

class IgnoreCommand {

    command() {
        return 'transfer <PROVIDER>';
    }

    run() {
        
    }

}


module.exports = IgnoreCommand;