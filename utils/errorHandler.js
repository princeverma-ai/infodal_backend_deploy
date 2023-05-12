//imports-------------------------------------------------------->
const mongoose = require("mongoose");

//exports-------------------------------------------------------->
exports.objectIdErrorHandler = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({
      status: "fail",
      message: `Invalid ID- ${req.params.id}`,
    });
  }
  next();
};

//------------------------------------------------------------>
exports.sendErrorMessage = (res, status, message, isServerError = false) => {
  if (isServerError) {
    console.log("ERROR: ", message);
    return res.status(500).json({
      status: "fail",
      message: "Something went wrong",
    });
  }

  if (message.includes("duplicate key")) message = "Duplicate Entry Found";

  if (message.includes("Cast to ObjectId failed")) message = "Invalid ID";

  if (message.includes("jwt")) {
    message = "Invalid Token";
    status = 401;
  }

  return res.status(status).json({
    status: "fail",
    message,
  });
};
