const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    // Array of document IDs the user is associated with
    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document", // Reference to the Document model
      },
    ],
  },
  { timestamps: true }
);


const User = mongoose.model("User", userSchema);
module.exports = User;
