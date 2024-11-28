const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  owner:{
    type:String,
    required:true,
  },
  access: {
    type: String,
    enum: ["public", "private"],
    default: "private", // Default to private
  },
  permissions: [
    {
      email: {
        type: String,
        required: true,
      },
      accessLevel: {
        type: String,
        enum: ["can edit", "can read", "no access"],
        default: "no access",
      },
    },
  ],
  versions: [
    {
      versionNumber: {
        type: String,
        required: true,
        default: 1, // Initial version
      },
      content: {
        type: Object,
      },
      updatedAt: {
        type: Date,
        default: Date.now(),
      },
      updatedBy: {
        type: String, // Store the email of the user who updated the document
        required: true,
      },
    },
  ],
});

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;
