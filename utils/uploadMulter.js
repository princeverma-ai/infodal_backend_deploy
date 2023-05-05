//imports ----------------------------------------------------->
const multer = require("multer");
const path = require("path");
const { sendErrorMessage } = require("./errorHandler");

//config ------------------------------------------------------>
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (process.env.NODE_ENV === "production") {
      cb(null, "/tmp/");
    } else {
      cb(null, path.join(__dirname, "..", "tmp"));
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + ".png");
  },
});

//multer ------------------------------------------------------>
const multerFunction = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
      cb(null, true);
    } else {
      cb(new Error("Not an image! Please upload an image.", 400), false);
    }
  },
});

//*Here image fieldname is "image" in the form
const singleImageMiddleware = multerFunction.single("image");

//------------------------------------------------------------>
const imageUploadErrorHandler = (err, req, res, next) => {
  if (err) {
    return sendErrorMessage(res, 400, `Error uploading image: ${err.message}`);
  }
  next();
};

//Exports ---------------------------------------------------->
module.exports = { singleImageMiddleware, imageUploadErrorHandler };
