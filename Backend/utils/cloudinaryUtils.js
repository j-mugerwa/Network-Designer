const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

// Parse CLOUDINARY_URL from environment variable
const cloudinaryUrl = process.env.CLOUDINARY_URL;

if (!cloudinaryUrl) {
  throw new Error("CLOUDINARY_URL environment variable is required");
}

// Extract configuration from URL
const cloudinaryConfig = {
  cloud_name: cloudinaryUrl.split("@")[1],
  api_key: cloudinaryUrl.split(":")[1].split("@")[0],
  api_secret: cloudinaryUrl.split(":")[2].split("@")[0],
};

// Configure Cloudinary
cloudinary.config(cloudinaryConfig);

/**
 * Uploads a file to Cloudinary with enhanced configuration support
 * @param {string} filePath - Path to the local file
 * @param {object} options - Upload options
 * @param {string} options.folder - Cloudinary folder (default: 'equipment')
 * @param {string} options.resourceType - 'image', 'raw', 'auto' (default: 'auto')
 * @param {boolean} options.overwrite - Whether to overwrite existing (default: true)
 * @returns {Promise<object>} - Cloudinary upload result with secure_url and public_id
 */
const uploadToCloudinary = async (filePath, options = {}) => {
  const {
    folder = "equipment",
    resourceType = "auto",
    overwrite = true,
  } = options;

  try {
    // Ensure the file exists
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }

    // Get file extension and type
    const ext = path.extname(filePath).toLowerCase();
    const isImage = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
    const isConfigFile = [
      ".txt",
      ".json",
      ".yaml",
      ".yml",
      ".conf",
      ".cfg",
    ].includes(ext);

    // Validate file type based on resource type
    if (resourceType === "image" && !isImage) {
      throw new Error("Unsupported image file type");
    }
    if (resourceType === "raw" && !isConfigFile) {
      throw new Error("Unsupported configuration file type");
    }

    // Upload options
    const uploadOptions = {
      folder: folder,
      use_filename: true,
      unique_filename: false,
      overwrite: overwrite,
      resource_type: resourceType,
    };

    // Upload the file
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    // Clean up the temporary file
    fs.unlinkSync(filePath);

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      original_filename: result.original_filename,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
    };
  } catch (error) {
    // Clean up the temporary file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error("Cloudinary upload error:", error.message);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Uploads a configuration file to Cloudinary
 * @param {string} filePath - Path to the local file
 * @param {string} folder - Cloudinary folder (default: 'configurations')
 * @returns {Promise<object>} - Cloudinary upload result
 */
const uploadConfigToCloudinary = async (
  filePath,
  folder = "configurations"
) => {
  return uploadToCloudinary(filePath, {
    folder: folder,
    resourceType: "raw",
  });
};

/**
 * Deletes a file from Cloudinary
 * @param {string} fileUrl - The Cloudinary URL of the file to delete
 * @param {string} resourceType - 'image' or 'raw' (default: 'auto')
 * @returns {Promise<void>}
 */
const deleteFromCloudinary = async (fileUrl, resourceType = "auto") => {
  try {
    if (!fileUrl || typeof fileUrl !== "string") {
      throw new Error("Invalid file URL");
    }

    // Extract public ID from URL
    const parts = fileUrl.split("/");
    const publicIdWithExtension = parts[parts.length - 1];
    const publicId = publicIdWithExtension.split(".")[0];
    const folder = parts[parts.length - 2];

    if (!publicId) {
      throw new Error("Could not extract public ID from URL");
    }

    // Full public ID including folder
    const fullPublicId = folder ? `${folder}/${publicId}` : publicId;

    await cloudinary.uploader.destroy(fullPublicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error("Cloudinary delete error:", error.message);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Checks if Cloudinary should be used based on environment variable
 * @returns {boolean}
 */
const shouldUseCloudinary = () => {
  return process.env.USE_CLOUDINARY === "true";
};

/**
 * Deletes a local file
 * @param {string} filePath - Path to the file to delete
 * @returns {Promise<void>}
 */
const deleteLocalFile = (filePath) => {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  uploadToCloudinary,
  uploadConfigToCloudinary,
  deleteFromCloudinary,
  shouldUseCloudinary,
  deleteLocalFile,
};
