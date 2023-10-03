const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const userScheme = new Schema({
    // * to store the id sent by the google
    id: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: [true, "email required"],
      unique: [true, "email already registered"],
    },
    firstName: String,
    lastName: String,
    profilePhoto: String,
    selectedTheme: {
        type: String,
        // Default theme when a user signs up
      },
    // * this is just to specify that from which source is it authorized
    source: {
      type: String,
      required: [true, "source not specified"],
    },
  
    lastPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
      }
  });
  
  module.exports = new model("User", userScheme);
  