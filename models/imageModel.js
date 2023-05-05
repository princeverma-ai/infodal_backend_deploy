//imports ----------------------------------------------------->
const mongoose = require("mongoose");

//schema ------------------------------------------------------>
const ImageSchema = new mongoose.Schema({
  asset_id: {
    type: String,
    required: [true, "Asset id is required"],
  },
  public_id: {
    type: String,
    required: [true, "Public id is required"],
  },
  signature: {
    type: String,
    required: [true, "Signature is required"],
  },
  width: {
    type: String,
    required: [true, "Width is required"],
  },
  height: {
    type: String,
    required: [true, "Height is required"],
  },
  size: {
    type: String,
    required: [true, "Size is required"],
  },
  filename: {
    type: String,
    required: [true, "Filename is required"],
  },
  root_filename: {
    type: String,
    required: [true, "Root filename is required"],
  },
  secure_url: {
    type: String,
    required: [true, "Secure url is required"],
  },
});

// model ----------------------------------------------->
const Image = mongoose.model("Image", ImageSchema);

//Export model ----------------------------------------------->
module.exports = Image;
