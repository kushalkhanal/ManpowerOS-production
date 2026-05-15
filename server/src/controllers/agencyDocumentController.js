import AgencyDocument from '../models/AgencyDocument.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import asyncHandler from '../utils/asyncHandler.js';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const createDocument = asyncHandler(async (req, res) => {
  const {
    title, description, category, visibleToRoles,
    isConfidential, version, previousVersionId,
    expiryDate, expiryAlertDays, tags
  } = req.body;

  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: 'File is required' });
  }

  const document = await AgencyDocument.create({
    agencyId: req.user.agencyId,
    uploadedBy: req.user.userId,
    title,
    description,
    category,
    fileUrl: file.filename,
    fileName: file.originalname,
    fileType: path.extname(file.originalname).slice(1).toLowerCase(),
    fileSizeKB: Math.round(file.size / 1024),
    visibleToRoles: visibleToRoles ? (typeof visibleToRoles === 'string' ? JSON.parse(visibleToRoles) : visibleToRoles) : [],
    isConfidential: isConfidential === 'true' || isConfidential === true,
    version,
    previousVersionId: previousVersionId || null,
    expiryDate: expiryDate || null,
    expiryAlertDays: expiryAlertDays ? parseInt(expiryAlertDays) : 60,
    tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : []
  });

  const populated = await AgencyDocument.findById(document._id)
    .populate('uploadedBy', 'name email');

  res.status(201).json(populated);
});

const getDocuments = asyncHandler(async (req, res) => {
  const { category, search, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = { agencyId: req.user.agencyId };
  
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { title: new RegExp(escapeRegex(search), 'i') },
      { tags: { $in: [new RegExp(escapeRegex(search), 'i')] } }
    ];
  }

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { isConfidential: false },
        { visibleToRoles: { $size: 0 } },
        { visibleToRoles: req.user.role }
      ]
    });
  }

  const [documents, total] = await Promise.all([
    AgencyDocument.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    AgencyDocument.countDocuments(filter)
  ]);

  const categoryCounts = await AgencyDocument.aggregate([
    { $match: { agencyId: req.user.agencyId } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  const counts = {};
  categoryCounts.forEach(c => { counts[c._id] = c.count; });

  res.status(200).json({
    data: documents,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    categoryCounts: counts
  });
});

const getDocumentById = asyncHandler(async (req, res) => {
  const document = await AgencyDocument.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId
  })
    .populate('uploadedBy', 'name email role')
    .populate('previousVersionId', 'title version');

  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  if (document.isConfidential && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  document.downloadCount += 1;
  await document.save();

  res.status(200).json(document);
});

const updateDocument = asyncHandler(async (req, res) => {
  const {
    title, description, category, visibleToRoles,
    isConfidential, version, expiryDate, expiryAlertDays, tags
  } = req.body;

  const document = await AgencyDocument.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId
  });

  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  if (title) document.title = title;
  if (description !== undefined) document.description = description;
  if (category) document.category = category;
  if (visibleToRoles) document.visibleToRoles = typeof visibleToRoles === 'string' ? JSON.parse(visibleToRoles) : visibleToRoles;
  if (isConfidential !== undefined) document.isConfidential = isConfidential === 'true' || isConfidential === true;
  if (version) document.version = version;
  if (expiryDate) document.expiryDate = expiryDate;
  if (expiryAlertDays) document.expiryAlertDays = parseInt(expiryAlertDays);
  if (tags) document.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;

  await document.save();

  const updated = await AgencyDocument.findById(document._id)
    .populate('uploadedBy', 'name email');

  res.status(200).json(updated);
});

const deleteDocument = asyncHandler(async (req, res) => {
  const document = await AgencyDocument.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId
  });

  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  const filePath = path.join(process.cwd(), 'uploads', 'documents', document.fileUrl);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    logger.warn(`Could not delete file: ${filePath}`, err.message);
  }

  await AgencyDocument.findByIdAndDelete(document._id);

  res.status(200).json({ message: 'Document deleted' });
});

const getExpiringDocuments = asyncHandler(async (req, res) => {
  const { days = 60 } = req.query;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + parseInt(days));

  const documents = await AgencyDocument.find({
    agencyId: req.user.agencyId,
    expiryDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  })
    .populate('uploadedBy', 'name email')
    .sort({ expiryDate: 1 })
    .lean();

  const enriched = documents.map(d => {
    const daysUntilExpiry = Math.ceil((new Date(d.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return { ...d, daysUntilExpiry };
  });

  res.status(200).json(enriched);
});

const downloadDocument = asyncHandler(async (req, res) => {
  const document = await AgencyDocument.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId
  });

  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  if (document.isConfidential && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const filePath = path.join(process.cwd(), 'uploads', 'documents', document.fileUrl);
  if (!existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found on server' });
  }

  document.downloadCount += 1;
  await document.save();

  res.download(filePath, document.fileName);
});

export {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getExpiringDocuments,
  downloadDocument
};