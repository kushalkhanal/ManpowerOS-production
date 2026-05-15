const x = [
  { $match: { a: 1 } },
  { $lookup: { from: 'b', localField: 'c', foreignField: '_id', as: 'd' } }
];
console.log(x);