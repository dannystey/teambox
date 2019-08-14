var fs = require('fs');
var ErrorController = require('../ErrorController');
var Timeular = require('../provider/Timeular');
var call = require('../helpers/CallHelper');
var leadingZeros = require('../helpers/LeadingZerosHelper');
var yesno = require('yesno');

class TransferCommand {

    command() {
        return 'transfer <PROVIDER>';
    }

    run(storagePath) {
        this.getEmployee().then((staffData) => {
            this.staffData = staffData;
            if(process.argv[3] === 'timeular') {
                this.provider = new Timeular();
                console.log('provider is timeular')
                if(process.argv[4] === 'connect'){
                    console.log('connect to timeular')
                    this.provider.connect(storagePath, process.argv[5], process.argv[6]);
                    return;
                }
                this.day = process.argv[4] ? new Date(process.argv[4]) : new Date;
                this.entryIndex = 0;
                this.provider.getTimeEntries(this.day.getFullYear(), this.day.getMonth() +1, this.day.getDate()).then((timeEntries) => {
                    this.timeEntries = timeEntries;
                    this.next();
                })
            }
        })
        
    }

    next() {
        if(!this.timeEntries[this.entryIndex]) {
            console.log('no further entries left.');
            process.exit();
        }
        this.transferToTeambox(this.timeEntries[this.entryIndex]);
        this.entryIndex += 1;
    }

    getEmployee() {
        return new Promise((resolve, reject) => {
            call('GET', '/rest/employee.json')
            .then(({ result }) => {
                const staffData = result.filter((employee) => employee.id == process.env.MAID)[0];
                resolve(staffData);
            })
            .catch(reject);
        })
    }

    transferToTeambox(entry) {
        console.log("\x1b[36m");
        console.log('.. get the job_id');
        let workData = {
            ma_id: process.env.MAID,
            info: entry.info,
            tag: [this.day.getFullYear(), leadingZeros(this.day.getMonth() +1), leadingZeros(this.day.getDate())].join('-'),
            external_ticket: null,
            syncKey: null,
            job_id: null, // required
            phase_id: null, // required
            lei_id: null, // required
            rate: null, // required
            level: this.staffData.level, // required
            std: Math.ceil((entry.duration / 1000 / 60 / 60) * 4) / 4
        }

        console.log('.. get job id');
        call('GET', '/rest/task.json?_sortfield=job_nr&_sortdir=ASC&jahr=%3E0&_limit=0&jobstatus%3Apermtime=1&aktiv=1')
        .then(({ result }) => {
            const getJob = (job_nr) => result.filter((job) => job.job_nr == job_nr);

            if(getJob(entry.job_nr).length) {
                workData.job_id = getJob(entry.job_nr)[0].id;

                console.log('.. get phase id');
                call('GET', `/rest/jobphase.json?job_id=${workData.job_id}&active=true`)
                .then( ({result}) => {
                    const getPhase = (phase) => result.filter((p) => p.name == phase);

                    if(getPhase(entry.phase).length) {
                        workData.phase_id = getPhase(entry.phase)[0].id;

                        console.log('.. get activity id');
                        call('GET', `/rest/activity.json?active=true&art=1&_checkRates=true&department=${this.staffData.abt_id}&task=${workData.job_id}&changeStaffLevel=false&stafflevel=${this.staffData.level}&tenant=${this.staffData.tenant}`)
                        .then( ({ result }) => {
                            const getActivity = (activity) => result.filter(a => a.bez === activity);

                            if(getActivity(entry.activity).length) {
                                workData.lei_id = getActivity(entry.activity)[0].id;
                                
                                console.log('.. get rate id');
                                call('GET', `https://vi-ag.teambox.de/rest/flattenedrate.json?active=1&activity=${workData.lei_id}&currency=&exchangerate=&_stafflevel=${this.staffData.level}&_level=Task-${workData.job_id}&_removeEmpty=1&tenant=`)
                                .then(({ result }) => {
                                    workData.rate = result[0].id;

                                    console.log('.. data prepared!')
                                    this.transfer(workData, entry);
                                })
                            }

                        })

                    }
                })
            }
            else {
                console.log('no job for job_nr: ' + entry.job_nr)
                this.next();
            }
        })
    }

    transfer(workData, entry) {
        console.log("\x1b[32m");
        yesno({
            question: `Are you sure you want to add ${entry.job_nr} to ${workData.tag} for ${workData.std}h?`
        }).then((ok) => {
            if(ok) {
                call('POST', '/rest/workdata.json', workData, 'formdata')
                .then((response) => {
                    console.log(response.success ? 'Done' : 'Failed');
                    this.next();
                })
                
            }
            else {
                console.log("\x1b[33m", `-> ${entry.job_nr} to ${workData.tag} for ${workData.std}h was skipped`);
                this.next();
            }
        });

        
    }

}


module.exports = TransferCommand;