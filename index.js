#!/usr/bin/env node
var RegisterCommand = require('./classes/commands/RegisterCommand');
var StatisticCommand = require('./classes/commands/StatisticCommand');
var path = require('path').dirname(require.main.filename);
require('dotenv').config({path: path + '/.env'});

let command = 'statistic';

if(process.argv[2]) {
    command = process.argv[2];
}

let withList = false;
let month = null;

switch(command) {
    case 'register': 
        register = new RegisterCommand();
        register.run(path);
        break;
    case 'list':
        withList = true;
    case 'month':
        month = process.argv[3] || null;
    case 'statistic': 
        statistic = new StatisticCommand();
        statistic.run(withList, month);
        break;
}