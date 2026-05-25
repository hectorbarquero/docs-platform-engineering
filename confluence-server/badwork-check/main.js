// barquerohr: call this from console. backup files and 
// never run from src. files susceptible to corruption on read.

const fs = require('fs');

const words = fs.readFileSync('words.txt', 'utf-8').split('\n').map(word => word.trim().toLowerCase());

function finder(words, markdown, chapterPrefix = '##') {
  const hits = [];

  const mdWords = markdown.match(/\b\w+\b/g);

  // debug show mdWords
  // console.log('mdWords:', mdWords);

  // match hit to project key
  const chapterMatch = markdown.match(new RegExp(`${chapterPrefix}\\s+(.+)`, 'i'));
  const chapter = chapterMatch ? chapterMatch[1] : 'Unknown Chapter';

  for (const word of words) {
    // Debug to show words checked
    // console.log('Checking word:', word);

    if (mdWords && mdWords.includes(word.toLowerCase())) {
      hits.push({ word, chapter });

      // debug show the hit
      console.log('Hit found for word:', word);
    }
  }

  return hits;
}

// process filename1.md ... change filename1
const seMarkdown = fs.readFileSync('filename1.md', 'utf-8');
const seHits = finder(words, seMarkdown, '##');

// process filename2.md
const deMarkdown = fs.readFileSync('filename2.md', 'utf-8');
const deHits = finder(words, deMarkdown, '##');

// combine
const allHits = [...seHits, ...deHits];

// debug statements
console.log('Words from wordlist:', words);
console.log('Hits found:', allHits);

if (allHits.length > 0) {
  const hitsOutput = allHits.map(hit => `Word: ${hit.word}, Chapter: ${hit.chapter}`).join('\n');

  // write to one file
  fs.writeFileSync('hits.txt', hitsOutput);
  console.log('Results written to hits.txt');
} else {
  console.log('Nothing found.');
}