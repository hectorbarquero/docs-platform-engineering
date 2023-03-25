//common js - no longer supported with ESM
//const jsonfile = require('jsonfile');
//const moment = require ('moment');
//const simpleGit = require('simple-git');
//const random = require('random');
//const FILE_PATH = './data.json';

//ES module -> use this instead
import simpleGit from 'simple-git';
import moment from 'moment';
import jsonfile from 'jsonfile';
import random from 'random';
const FILE_PATH = './data.json';

//recursion for y weeks, x days
const makeCommit = n => {
    if(n===0) return simpleGit().push();
    const x = random.int(0,54);
    const y = random.int(0,6);
    const DATE = moment().subtract(6,'y').add(1, 'd')
                    .add(x, 'w').add(y,'d').format();

    const data = {
        date: DATE
    }
    //log date to check
    console.log(DATE);

    //add a json callback to write a-synchronously
    jsonfile.writeFile(FILE_PATH, data, ()=>{
    // git commit --date='an example date'
    simpleGit().add([FILE_PATH]).commit(DATE, {'--date': DATE }, 
    makeCommit.bind(this, --n));
    });
}

makeCommit(87);