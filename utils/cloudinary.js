//imports ----------------------------------------------------->
const cloudinary = require("cloudinary").v2;
const path = require("path");

//config ------------------------------------------------------>

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//Upload ---------------------------------------------------->
const uploadCloudinary = async (file) => {
  try {
    if (process.env.NODE_ENV === "production") {
      //upload file to cloudinary
      const result = await cloudinary.uploader.upload("/tmp/" + file.filename);
      return result;
    } else {
      //upload file to cloudinary
      const result = await cloudinary.uploader.upload(
        path.join(__dirname, "..", "tmp", file.filename)
      );
      return result;
    }
  } catch (error) {
    return new Error(`Could not upload file to cloudinary: ${error}`);
  }
};

//delete file from cloudinary------------------------------->
const deleteCloudinary = async (public_id) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    return result;
  } catch (error) {
    return new Error(`Could not delete file from cloudinary: ${error}`);
  }
};
//Exports ---------------------------------------------------->
exports.uploadCloudinary = uploadCloudinary;
exports.deleteCloudinary = deleteCloudinary;
