const mongoose = require("mongoose");
const teamSchema = new mongoose.Schema({
  name: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
        enum: ["owner", "admin", "member"],
        default: "member",
      },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Team", teamSchema);
