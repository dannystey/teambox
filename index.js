var RegisterCommand = require('./classes/commands/RegisterCommand');
var StatisticCommand = require('./classes/commands/StatisticCommand');
require('dotenv').config({path: __dirname + '/.env'});

let command = 'statistic';

if(process.argv[2]) {
    command = process.argv[2];
}

switch(command) {
    case 'register': 
        register = new RegisterCommand();
        register.run(__dirname);
        break;
    case 'statistic': 
        statistic = new StatisticCommand();
        statistic.run();
        break;
}