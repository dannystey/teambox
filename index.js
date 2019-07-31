#!/usr/bin/env node
var RegisterCommand = require('./classes/commands/RegisterCommand');
var StatisticCommand = require('./classes/commands/StatisticCommand');
var path = require('path').dirname(require.main.filename);
require('dotenv').config({path: path + '/.env'});

let command = 'statistic';

if(process.argv[2]) {
    command = process.argv[2];
}

switch(command) {
    case 'register': 
        register = new RegisterCommand();
        register.run(path);
        break;
    case 'statistic': 
        statistic = new StatisticCommand();
        statistic.run();
        break;
}