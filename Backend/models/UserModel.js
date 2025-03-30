const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUID: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
    },
    company: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "network-admin", "user"],
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("User", userSchema);
