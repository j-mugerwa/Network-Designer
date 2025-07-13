const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Define file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir = "uploads";

    // Create subdirectories based on file type
    if (file.mimetype.startsWith("image/")) {
      uploadDir = path.join(uploadDir, "images");
    } else {
      uploadDir = path.join(uploadDir, "configs");
    }

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// Supported file formats
const supportedMimeTypes = [
  // Images
  "image/png",
  "image/jpg",
  "image/jpeg",
  "image/webp",
  "image/gif",

  // Configuration files
  "text/plain",
  "application/json",
  "application/x-yaml",
  "text/yaml",
  "text/x-shellscript",
  "application/xml",
  "text/xml",
  "text/csv",
  "text/ini",
  "text/x-python",
];

// File filter function
function fileFilter(req, file, cb) {
  if (supportedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file format: ${file.mimetype}`), false);
  }
}

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Single file upload
  },
});

// File Size Formatter
const fileSizeFormatter = (bytes, decimal) => {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const dm = decimal || 2;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "YB", "ZB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1000));
  return (
    parseFloat((bytes / Math.pow(1000, index)).toFixed(dm)) + " " + sizes[index]
  );
};

// Middleware to clean up uploaded files on error
const cleanupUploads = (req, res, next) => {
  // Attach cleanup function to request
  req.cleanupUploads = async () => {
    if (req.file) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (err) {
        console.error("Error cleaning up uploaded file:", err);
      }
    }
  };

  // Clean up on response finish
  const originalSend = res.send;
  res.send = function (...args) {
    if (res.statusCode >= 400) {
      req.cleanupUploads();
    }
    originalSend.apply(res, args);
  };

  next();
};

module.exports = {
  upload,
  fileSizeFormatter,
  cleanupUploads,
  supportedMimeTypes,
};
