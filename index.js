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

const git = simpleGit(); // Initialize Git in the working directory

// recursion for y weeks, x days in 2023-2024
const makeCommit = async n => {
    if (n === 0) {
        console.log("All commits made, pushing to remote.");
        return git.push().catch(err => console.error("Push failed:", err));
    }

    // Set start and end dates
    const startDate = moment('2024-10-01');
    const endDate = moment('2025-08-10');

    // Calculate a random number of days between the start and end dates
    const randomDays = random.int(0, endDate.diff(startDate, 'days'));

    // Add the random number of days to the start date to get a commit date
    const DATE = startDate.add(randomDays, 'days').format();

    const data = {
        date: DATE
    };

    // Log date to check
    console.log(`Committing for date: ${DATE}`);

    // Write to JSON asynchronously
    jsonfile.writeFile(FILE_PATH, data, async () => {
        try {
            // Git add and commit
            await git.add([FILE_PATH]);
            await git.commit(`Commit for date ${DATE}`, {'--date': DATE});

            // Recurse for the next commit
            makeCommit(n - 1);
        } catch (err) {
            console.error("Commit failed:", err);
        }
    });
};

// Start making commits
makeCommit(227);