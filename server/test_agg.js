import JobDemand from './models/JobDemand.js';

const test = async () => {
  const result = await JobDemand.aggregate([
    { $match: { status: 'active' } }
  ]);
  console.log('Result:', result);
};

test().catch(console.error);