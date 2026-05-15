import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import logger from '../config/logger.js';

let visionClient = null;
if (process.env.GOOGLE_VISION_KEY_FILE) {
  try {
    const vision = require('@google-cloud/vision');
    visionClient = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_VISION_KEY_FILE
    });
    logger.info('[OCR] Google Cloud Vision API initialized');
  } catch (err) {
    logger.warn('[OCR] Google Cloud Vision not available:', err.message);
  }
}

const isVisionConfigured = () => visionClient !== null;

export const extractPassportData = async (imageBuffer) => {
  try {
    const processedBuffer = await preprocessImage(imageBuffer);
    let mrzData = null;
    let visualData = null;
    let ocrSource = 'none';

    if (isVisionConfigured()) {
      try {
        mrzData = await extractWithVision(processedBuffer);
        ocrSource = mrzData ? 'vision_mrz' : 'vision_visual';
      } catch (visionErr) {
        logger.warn('[OCR] Vision API failed, using Tesseract:', visionErr.message);
      }
    }

    if (!mrzData) {
      const tesseractResult = await extractWithTesseract(processedBuffer);
      mrzData = tesseractResult.mrz;
      visualData = tesseractResult.visual;
      ocrSource = mrzData ? 'tesseract_mrz' : 'tesseract_visual';
    }

    if (!visualData) {
      visualData = {};
    }

    const mergedData = mergeData(mrzData, visualData);
    const confidence = calculateConfidence(mrzData, visualData);
    const warnings = generateWarnings(mergedData, confidence);

    return {
      ...mergedData,
      confidence,
      source: ocrSource,
      warnings,
      rawText: visualData.rawText || ''
    };
  } catch (error) {
    logger.error('[OCR] Extraction failed:', error);
    throw new Error('Failed to extract passport data: ' + error.message);
  }
};

const preprocessImage = async (buffer) => {
  return await sharp(buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .sharpen()
    .normalize()
    .grayscale()
    .toBuffer();
};

const extractWithVision = async (buffer) => {
  const [result] = await visionClient.textDetection({
    image: { content: buffer.toString('base64') }
  });

  const fullText = result.fullTextAnnotation?.text || '';
  return parsePassportText(fullText);
};

const extractWithTesseract = async (buffer) => {
  const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
    logger: () => {}
  });

  return parsePassportText(text);
};

const parsePassportText = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const mrzLine1 = lines.find(l => l.startsWith('P<NPL') || l.startsWith('PNPL'));
  const mrzLine2 = lines.find(l => /^[A-Z0-9<]{44}$/.test(l));

  let mrz = null;
  if (mrzLine1 && mrzLine2) {
    mrz = parseMRZ(mrzLine1, mrzLine2);
  }

  const visual = extractVisualFields(text);

  return { mrz, visual };
};

const parseMRZ = (line1, line2) => {
  try {
    const namePart = line1.substring(5).replace(/</g, ' ').trim();
    const nameParts = namePart.split(/\s+/).filter(p => p.length > 0);
    const surname = nameParts[0] || '';
    const givenNames = nameParts.slice(1).join(' ') || '';

    const passportNumber = line2.substring(0, 9).replace(/</g, '').trim();
    const nationality = line2.substring(9, 12).replace(/</g, '').trim();
    const dobRaw = line2.substring(13, 19);
    const genderRaw = line2.substring(20, 21);
    const expiryRaw = line2.substring(19, 25);
    const personalNumberRaw = line2.substring(28, 42).replace(/</g, '').trim();

    return {
      passportNumber,
      personalNumber: personalNumberRaw,
      surname,
      givenNames,
      fullName: `${givenNames} ${surname}`.trim().toUpperCase(),
      dateOfBirth: mrzDateToJS(dobRaw),
      expiryDate: mrzDateToJS(expiryRaw, true),
      gender: genderRaw === 'M' ? 'male' : genderRaw === 'F' ? 'female' : '',
      nationality: nationality || 'NPL'
    };
  } catch (err) {
    logger.warn('[OCR] MRZ parsing error:', err.message);
    return null;
  }
};

const mrzDateToJS = (yymmdd, isExpiry = false) => {
  if (!yymmdd || yymmdd.includes('<') || yymmdd.length !== 6) return null;
  try {
    const yy = parseInt(yymmdd.substring(0, 2));
    const mm = parseInt(yymmdd.substring(2, 4)) - 1;
    const dd = parseInt(yymmdd.substring(4, 6));

    const fullYear = isExpiry
      ? (yy <= 30 ? 2000 + yy : 1900 + yy)
      : (yy <= 10 ? 2000 + yy : 1900 + yy);

    const date = new Date(fullYear, mm, dd);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

const extractVisualFields = (text) => {
  const patterns = {
    passportNumber: /(?:Passport No\.?|Passport No|PN|No\.)\s*:?\s*([A-Z]{1,2}\d{6,9})/i,
    personalNumber: /(?:Personal No\.?|Personal Number)\s*:?\s*([A-Z0-9\-]+)/i,
    surname: /(?:Surname|Family Name|Last Name)\s*:?\s*([A-Z\s]+)/i,
    givenNames: /(?:Given Names?|First Name|Given Name)\s*:?\s*([A-Z\s]+)/i,
    dateOfBirth: /(?:Date of Birth|DOB|Birth Date)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    issueDate: /(?:Date of Issue|Issued Date|Issue Date)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    expiryDate: /(?:Date of Expiry|Expiry Date|Valid Until|Expiry)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    issuedDistrict: /(?:Place of Issue|Issued at|Issuing District|District)\s*:?\s*([A-Za-z\s]+)/i,
    gender: /(?:Sex|Gender)\s*:?\s*(Male|Female|M|F)/i
  };

  const result = { rawText: text };
  for (const [field, regex] of Object.entries(patterns)) {
    const match = text.match(regex);
    if (match) {
      result[field] = match[1].trim();
    }
  }

  if (result.passportNumber && !/^[A-Z]{1,2}\d{6,9}$/i.test(result.passportNumber)) {
    result.passportNumber = result.passportNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  }

  if (result.dateOfBirth) {
    result.dateOfBirth = parseVisualDate(result.dateOfBirth);
  }
  if (result.issueDate) {
    result.issueDate = parseVisualDate(result.issueDate);
  }
  if (result.expiryDate) {
    result.expiryDate = parseVisualDate(result.expiryDate);
  }

  return result;
};

const parseVisualDate = (dateStr) => {
  try {
    const parts = dateStr.split(/[\/\-\.]/);
    if (parts.length === 3) {
      let [d, m, y] = parts.map(p => parseInt(p));
      if (y < 100) y += 2000;
      const date = new Date(y, m - 1, d);
      if (!isNaN(date.getTime())) return date;
    }
  } catch {}
  return null;
};

const mergeData = (mrz, visual) => {
  const result = {
    passportNumber: mrz?.passportNumber || visual?.passportNumber || '',
    personalNumber: mrz?.personalNumber || visual?.personalNumber || '',
    surname: mrz?.surname || visual?.surname || '',
    givenNames: mrz?.givenNames || visual?.givenNames || '',
    fullName: mrz?.fullName || visual?.givenNames && visual?.surname 
      ? `${visual.givenNames} ${visual.surname}`.trim().toUpperCase() 
      : '',
    dateOfBirth: mrz?.dateOfBirth || visual?.dateOfBirth || null,
    gender: mrz?.gender || visual?.gender || '',
    nationality: mrz?.nationality || 'NPL',
    issueDate: visual?.issueDate || null,
    expiryDate: mrz?.expiryDate || visual?.expiryDate || null,
    issuedDistrict: visual?.issuedDistrict || ''
  };

  if (result.gender && typeof result.gender === 'string') {
    if (result.gender.toLowerCase().startsWith('m')) result.gender = 'male';
    else if (result.gender.toLowerCase().startsWith('f')) result.gender = 'female';
  }

  return result;
};

const calculateConfidence = (mrz, visual) => {
  return {
    passportNumber: mrz?.passportNumber ? 0.99 : (visual?.passportNumber ? 0.7 : 0),
    name: mrz?.surname ? 0.95 : (visual?.surname || visual?.givenNames ? 0.6 : 0),
    dateOfBirth: mrz?.dateOfBirth ? 0.99 : (visual?.dateOfBirth ? 0.7 : 0),
    expiryDate: mrz?.expiryDate ? 0.99 : (visual?.expiryDate ? 0.7 : 0),
    gender: mrz?.gender ? 0.95 : (visual?.gender ? 0.7 : 0),
    issuedDistrict: visual?.issuedDistrict ? 0.7 : 0
  };
};

const generateWarnings = (data, confidence) => {
  const warnings = [];
  if (!data.passportNumber) warnings.push('Passport number could not be detected — please enter manually');
  if (!data.fullName) warnings.push('Full name could not be detected — please enter manually');
  if (!data.issuedDistrict) warnings.push('Issued district could not be detected — please enter manually');
  if (confidence.passportNumber < 0.9) warnings.push('Passport number confidence is low — please verify');
  if (confidence.expiryDate < 0.9) warnings.push('Expiry date confidence is low — please verify');
  return warnings;
};

export default {
  extractPassportData,
  isVisionConfigured
};