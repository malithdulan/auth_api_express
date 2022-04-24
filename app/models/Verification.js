const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema({
  token: {
    type: String,
    maxlength: 255,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  type: {
    type: String,
    required: true,
    maxlength: 255,
  },
  accountType: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Verification", verificationSchema);
