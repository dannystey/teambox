#!/usr/bin/env node
var RegisterCommand = require('./classes/commands/RegisterCommand');
var StatisticCommand = require('./classes/commands/StatisticCommand');
var IgnoreCommand = require('./classes/commands/IgnoreCommand');
const homedir = require('os').homedir();
var path = require('path').dirname(require.main.filename);
require('dotenv').config({path: homedir + '/.teambox/.env'});

let command = 'statistic';

if(process.argv[2]) {
    command = process.argv[2];
}

let withList = false;
let month = null;

switch(command) {
    case 'ignore':
        let ignore = new IgnoreCommand();
        ignore.run(homedir + '/.teambox');
        break;
    case 'register': 
        let register = new RegisterCommand();
        register.run(path, homedir + '/.teambox');
        break;
    case 'list':
        withList = true;
    case 'month':
        month = process.argv[3] || null;
    case 'statistic': 
        let statistic = new StatisticCommand();
        statistic.run(withList, month);
        break;
}