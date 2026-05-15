import fs from 'fs';

const original = fs.readFileSync('./controllers/alertController.js', 'utf8');

const fixed = original
  .replace(/\$match/g, 'MATCH')
  .replace(/\$lookup/g, 'LOOKUP')
  .replace(/\$unwind/g, 'UNWIND')
  .replace(/\$project/g, 'PROJECT')
  .replace(/\$ne/g, 'NE')
  .replace(/\$in/g, 'IN')
  .replace(/\$lte/g, 'LTE')
  .replace(/\$gte/g, 'GTE')
  .replace(/\$size/g, 'SIZE')
  .replace(/\$nin/g, 'NIN');

const reversed = fixed
  .replace(/MATCH/g, '$match')
  .replace(/LOOKUP/g, '$lookup')
  .replace(/UNWIND/g, '$unwind')
  .replace(/PROJECT/g, '$project')
  .replace(/NE/g, '$ne')
  .replace(/IN/g, '$in')
  .replace(/LTE/g, '$lte')
  .replace(/GTE/g, '$gte')
  .replace(/SIZE/g, '$size')
  .replace(/NIN/g, '$nin');

fs.writeFileSync('./controllers/alertController_clean.js', reversed);
console.log('Done');