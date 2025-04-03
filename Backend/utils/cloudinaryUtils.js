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
 * Uploads a file to Cloudinary
 * @param {string} filePath - Path to the local file
 * @param {string} folder - Cloudinary folder (default: 'equipment')
 * @returns {Promise<string>} - Secure URL of the uploaded file
 */
const uploadToCloudinary = async (filePath, folder = "equipment") => {
  try {
    // Ensure the file exists
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }

    // Get file extension
    const ext = path.extname(filePath).toLowerCase();
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    if (!allowedExtensions.includes(ext)) {
      throw new Error("Unsupported file type");
    }

    // Upload options
    const uploadOptions = {
      folder: folder,
      use_filename: true,
      unique_filename: false,
      overwrite: true,
      resource_type: "auto",
    };

    // Upload the file
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    // Clean up the temporary file
    fs.unlinkSync(filePath);

    return result.secure_url;
  } catch (error) {
    // Clean up the temporary file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error("Cloudinary upload error:", error.message);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Deletes a file from Cloudinary
 * @param {string} imageUrl - The Cloudinary URL of the image to delete
 * @returns {Promise<void>}
 */
const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (!imageUrl || typeof imageUrl !== "string") {
      throw new Error("Invalid image URL");
    }

    // Extract public ID from URL
    const parts = imageUrl.split("/");
    const publicIdWithExtension = parts[parts.length - 1];
    const publicId = publicIdWithExtension.split(".")[0];
    const folder = parts[parts.length - 2];

    if (!publicId) {
      throw new Error("Could not extract public ID from URL");
    }

    // Full public ID including folder
    const fullPublicId = folder ? `${folder}/${publicId}` : publicId;

    await cloudinary.uploader.destroy(fullPublicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error.message);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Checks if Cloudinary should be used based on environment variable
 * @returns {boolean}
 */
const shouldUseCloudinary = () => {
  return process.env.USE_CLOUDINARY === "true";
};

const deleteLocalFile = (fileUrl) => {
  return new Promise((resolve, reject) => {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      path.basename(fileUrl)
    );

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
  deleteFromCloudinary,
  shouldUseCloudinary,
  deleteLocalFile,
};
