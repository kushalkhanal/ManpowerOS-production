import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";
import logger from "../config/logger.js";

// Conditionally import CloudinaryStorage only if configured
let CloudinaryStorage;
try {
  const pkg = await import("multer-storage-cloudinary");
  CloudinaryStorage = pkg.CloudinaryStorage || pkg.default;
} catch (error) {
  logger.warn(
    "multer-storage-cloudinary not available, using local storage only",
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

const buildAgencySegment = (req) => {
  const raw = req.user?.agencyId?.toString() || "unknown";
  return raw.replace(/[^a-zA-Z0-9_-]/g, "");
};

const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "orientation");
    ensureDirExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `orientation_cert_${req.params.id || "new"}_${uniqueSuffix}${path.extname(file.originalname)}`,
    );
  },
});

const passportScanLocalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "passports", "scans");
    ensureDirExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = file.mimetype.split("/")[1] || "bin";
    cb(null, `passport_scan_${uniqueSuffix}.${ext}`);
  },
});

const localFileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "application/pdf",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and images (JPG, PNG, WebP) allowed"), false);
  }
};

const localUpload = multer({
  storage: localStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: localFileFilter,
});

// Cloudinary storage (only if configured and available)
let orientationCertStorage = localStorage;
let passportScanStorage = passportScanLocalStorage;

if (CloudinaryStorage && isCloudinaryConfigured()) {
  orientationCertStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const agencyId = buildAgencySegment(req);
      return {
        folder: `manpoweros/${agencyId}/orientation`,
        allowed_formats: ["pdf", "jpg", "jpeg", "png"],
        public_id: `orientation_cert_${req.params.id || "new"}_${Date.now()}`,
        resource_type: "auto",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      };
    },
  });

  passportScanStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const agencyId = buildAgencySegment(req);
      return {
        folder: `manpoweros/${agencyId}/passports`,
        allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
        public_id: `passport_scan_${Date.now()}`,
        resource_type: "auto",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      };
    },
  });
}

export { orientationCertStorage, passportScanStorage };

export const uploadOrientationCert = multer({
  storage: orientationCertStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and images allowed"), false);
    }
  },
});

export const uploadAttendanceSheet = multer({
  storage: isCloudinaryConfigured() ? orientationCertStorage : localStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and images allowed"), false);
    }
  },
});

export const deleteCloudinaryFile = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    } catch (rawError) {
      logger.error("Cloudinary delete error:", rawError);
    }
  }
};

const stripFileExtension = (value) => {
  const lastDotIndex = value.lastIndexOf(".");
  if (lastDotIndex === -1) return value;
  return value.slice(0, lastDotIndex);
};

export const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return null;
  try {
    const { pathname } = new URL(url);
    const uploadMarker = "/upload/";
    const markerIndex = pathname.indexOf(uploadMarker);
    if (markerIndex === -1) return null;

    const afterUpload = pathname.slice(markerIndex + uploadMarker.length);
    const segments = afterUpload.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    const first = segments[0];
    const versionPrefixed = /^v\d+$/;
    const contentSegments = versionPrefixed.test(first)
      ? segments.slice(1)
      : segments;
    if (contentSegments.length === 0) return null;

    const lastIndex = contentSegments.length - 1;
    contentSegments[lastIndex] = stripFileExtension(contentSegments[lastIndex]);
    return contentSegments.join("/");
  } catch (error) {
    return null;
  }
};

export const uploadPassportScan = multer({
  storage: passportScanStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, JPEG, PNG, and WebP images allowed"), false);
    }
  },
});

export const agencyLogoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "logos");
    ensureDirExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `agency_logo_${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Agency logo storage
let agencyLogoCloudStorage = agencyLogoStorage;
if (CloudinaryStorage && isCloudinaryConfigured()) {
  agencyLogoCloudStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req) => {
      const agencyId = buildAgencySegment(req);
      return {
        folder: `manpoweros/${agencyId}/logos`,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        public_id: `agency_logo_${Date.now()}`,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      };
    },
  });
}

export const uploadAgencyLogo = multer({
  storage: agencyLogoCloudStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and WebP images allowed"), false);
    }
  },
});

/**
 * Generic document upload middleware factory with Cloudinary-first storage.
 * @param {string|Function} folder - Cloudinary folder name, or a function (fieldname) => folderName for multi-field uploads.
 * @param {Object} options - Optional: { fileSize } (default 10MB)
 */
export const createDocumentUpload = (folder, options = {}) => {
  const { fileSize = 10 * 1024 * 1024 } = options;

  const resolveFolder = (fieldname) =>
    typeof folder === "function" ? folder(fieldname) : folder;

  let storage;

  if (CloudinaryStorage && isCloudinaryConfigured()) {
    storage = new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => {
        const agencyId = buildAgencySegment(req);
        const resolved = resolveFolder(file.fieldname);
        return {
          folder: `manpoweros/${agencyId}/${resolved}`,
          allowed_formats: ["pdf", "jpg", "jpeg", "png", "webp"],
          public_id: `${resolved.replace(/\//g, "_")}_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
          resource_type: "auto",
        };
      },
    });
  } else {
    storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const resolved = resolveFolder(file.fieldname);
        const uploadDir = path.join(process.cwd(), "uploads", resolved);
        ensureDirExists(uploadDir);
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
      },
    });
  }

  const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WEBP, and PDF files are allowed"), false);
    }
  };

  return multer({ storage, limits: { fileSize }, fileFilter });
};

export default {
  uploadOrientationCert,
  uploadAttendanceSheet,
  deleteCloudinaryFile,
  isCloudinaryConfigured,
  uploadPassportScan,
  passportScanStorage,
};
