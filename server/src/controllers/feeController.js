import FeeTransaction from '../models/FeeTransaction.js';
import Candidate from '../models/Candidate.js';
import asyncHandler from '../utils/asyncHandler.js';

const createTransaction = asyncHandler(async (req, res) => {
  const {
    candidateId, transactionType, direction, amountNPR,
    paymentMethod, transactionReference, paidAt, notes
  } = req.body;

  if (!candidateId || !transactionType || !direction || !amountNPR) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  const candidate = await Candidate.findOne({ _id: candidateId, agencyId: req.user.agencyId });
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  const transactionData = {
    agencyId: req.user.agencyId,
    candidateId,
    transactionType,
    direction,
    amountNPR: parseFloat(amountNPR),
    paymentMethod,
    transactionReference,
    paidAt: paidAt || new Date(),
    receivedBy: req.user.userId || req.user._id,
    notes
  };

  if (req.file) {
    if (req.file.path) {
      transactionData.receiptUrl = req.file.path;
    }
  }

  const transaction = await FeeTransaction.create(transactionData);

  await updateCandidatePaymentStatus(candidateId, req.user.agencyId);

  res.status(201).json(transaction);
});

const getTransactions = asyncHandler(async (req, res) => {
  const { candidateId, transactionType, direction, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = { agencyId: req.user.agencyId };
  if (candidateId) filter.candidateId = candidateId;
  if (transactionType) filter.transactionType = transactionType;
  if (direction) filter.direction = direction;

  const [transactions, total] = await Promise.all([
    FeeTransaction.find(filter)
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('candidateId', 'fullName phone passportNumber')
      .populate('receivedBy', 'name')
      .lean(),
    FeeTransaction.countDocuments(filter)
  ]);

  res.status(200).json({
    data: transactions,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
});

const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await FeeTransaction.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId
  })
    .populate('candidateId', 'fullName phone passportNumber')
    .populate('receivedBy', 'name');

  if (!transaction) {
    return res.status(404).json({ message: 'Transaction not found' });
  }

  res.status(200).json(transaction);
});

const updateTransaction = asyncHandler(async (req, res) => {
  const { transactionType, direction, amountNPR, paymentMethod, transactionReference, paidAt, notes } = req.body;

  const transaction = await FeeTransaction.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId
  });

  if (!transaction) {
    return res.status(404).json({ message: 'Transaction not found' });
  }

  const updates = { transactionType, direction, amountNPR, paymentMethod, transactionReference, paidAt, notes };
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      if (key === 'amountNPR') transaction[key] = parseFloat(updates[key]);
      else if (key === 'paidAt') transaction[key] = new Date(updates[key]);
      else transaction[key] = updates[key];
    }
  });

  await transaction.save();

  await updateCandidatePaymentStatus(transaction.candidateId, req.user.agencyId);

  res.status(200).json(transaction);
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await FeeTransaction.findOneAndDelete({
    _id: req.params.id,
    agencyId: req.user.agencyId
  });

  if (!transaction) {
    return res.status(404).json({ message: 'Transaction not found' });
  }

  await updateCandidatePaymentStatus(transaction.candidateId, req.user.agencyId);

  res.status(200).json({ message: 'Transaction deleted' });
});

const getSummary = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const agencyId = req.user.agencyId;

  let dateFilter = {};
  if (year && month) {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    dateFilter = { paidAt: { $gte: startDate, $lte: endDate } };
  } else if (year) {
    const startDate = new Date(parseInt(year), 0, 1);
    const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
    dateFilter = { paidAt: { $gte: startDate, $lte: endDate } };
  }

  const pipeline = [
    { $match: { agencyId, ...dateFilter } },
    {
      $group: {
        _id: '$direction',
        total: { $sum: '$amountNPR' },
        count: { $sum: 1 }
      }
    }
  ];

  const results = await FeeTransaction.aggregate(pipeline);

  const summary = {
    totalReceived: 0,
    totalPaid: 0,
    receivedCount: 0,
    paidCount: 0
  };

  results.forEach(r => {
    if (r._id === 'received') {
      summary.totalReceived = r.total;
      summary.receivedCount = r.count;
    } else if (r._id === 'paid') {
      summary.totalPaid = r.total;
      summary.paidCount = r.count;
    }
  });

  summary.net = summary.totalReceived - summary.totalPaid;

  const outstandingPipeline = [
    { $match: { agencyId, direction: 'received', transactionType: 'service_fee' } },
    { $group: { _id: '$candidateId', totalReceived: { $sum: '$amountNPR' } } },
    { $lookup: { from: 'candidates', localField: '_id', foreignField: '_id', as: 'candidate' } },
    { $unwind: '$candidate' },
    { $match: { 'candidate.serviceFeeAgreed': { $gt: 0 } } },
    {
      $group: {
        _id: null,
        totalOutstanding: {
          $sum: { $subtract: ['$candidate.serviceFeeAgreed', '$totalReceived'] }
        }
      }
    }
  ];

  try {
    const outstandingResult = await FeeTransaction.aggregate(outstandingPipeline);
    summary.outstanding = outstandingResult.length > 0 ? outstandingResult[0].totalOutstanding : 0;
  } catch (e) {
    summary.outstanding = 0;
  }

  const monthlyPipeline = [
    { $match: { agencyId, paidAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
        received: {
          $sum: { $cond: [{ $eq: ['$direction', 'received'] }, '$amountNPR', 0] }
        },
        paid: {
          $sum: { $cond: [{ $eq: ['$direction', 'paid'] }, '$amountNPR', 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ];

  const monthlyData = await FeeTransaction.aggregate(monthlyPipeline);
  summary.monthly = monthlyData;

  res.status(200).json(summary);
});

const getCandidateSummary = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;

  const candidate = await Candidate.findOne({ _id: candidateId, agencyId: req.user.agencyId });
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  const transactions = await FeeTransaction.find({
    agencyId: req.user.agencyId,
    candidateId
  })
    .sort({ paidAt: -1 })
    .populate('receivedBy', 'name')
    .lean();

  const summary = {
    totalReceived: 0,
    totalPaid: 0,
    breakdown: {}
  };

  TRANSACTION_TYPES.forEach(type => {
    summary.breakdown[type] = { received: 0, paid: 0 };
  });

  transactions.forEach(t => {
    const key = t.direction === 'received' ? 'received' : 'paid';
    if (summary.breakdown[t.transactionType]) {
      summary.breakdown[t.transactionType][key] += t.amountNPR;
    }
    if (t.direction === 'received') {
      summary.totalReceived += t.amountNPR;
    } else {
      summary.totalPaid += t.amountNPR;
    }
  });

  const outstanding = (candidate.serviceFeeAgreed || 0) - summary.totalReceived;
  summary.outstanding = outstanding > 0 ? outstanding : 0;
  summary.serviceFeeAgreed = candidate.serviceFeeAgreed || 0;

  res.status(200).json({
    transactions,
    summary
  });
});

const updateCandidatePaymentStatus = async (candidateId, agencyId) => {
  const transactions = await FeeTransaction.find({ candidateId, agencyId, direction: 'received' });
  const totalReceived = transactions.reduce((sum, t) => sum + t.amountNPR, 0);

  const candidate = await Candidate.findById(candidateId);
  if (!candidate) return;

  if (totalReceived === 0) {
    candidate.paymentStatus = 'unpaid';
  } else if (totalReceived >= (candidate.serviceFeeAgreed || 0)) {
    candidate.paymentStatus = 'paid';
    candidate.serviceFeeReceived = totalReceived;
  } else {
    candidate.paymentStatus = 'partial';
    candidate.serviceFeeReceived = totalReceived;
  }

  await candidate.save();
};

const TRANSACTION_TYPES = [
  'service_fee', 'document_charge', 'medical_charge', 'orientation_charge',
  'insurance_charge', 'visa_charge', 'other'
];

export {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getCandidateSummary
};