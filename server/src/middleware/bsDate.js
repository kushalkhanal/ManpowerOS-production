import { bsDateRangeToAD } from '../utils/bsDate.js';

export const parseBSDateFilter = (req, res, next) => {
  const { bsYear, bsMonth, startDate, endDate } = req.query;

  if (bsYear && bsMonth) {
    const range = bsDateRangeToAD(bsYear, bsMonth);
    if (range) {
      req.query.startDate = range.start.toISOString();
      req.query.endDate = range.end.toISOString();
    }
  }

  if (startDate && endDate) {
    req.query.startDate = startDate;
    req.query.endDate = endDate;
  }

  next();
};

export const addBSFieldsToResponse = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    if (data && typeof data === 'object') {
      const processed = processBSFields(data);
      return originalJson.call(this, processed);
    }
    return originalJson.call(this, data);
  };
  next();
};

const processBSFields = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => processBSFields(item));
  }
  if (obj && typeof obj === 'object') {
    const result = { ...obj };
    Object.keys(result).forEach(key => {
      if (key.endsWith('BS') && result[key]) {
      }
    });
    return result;
  }
  return obj;
};

export default { parseBSDateFilter, addBSFieldsToResponse };