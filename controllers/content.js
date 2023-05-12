//imports ----------------------------------------------------->
const ContentModel = require("../models/content");
const { sendErrorMessage } = require("../utils/errorHandler");

//Error Handler----------------------------------------------->
const notFoundErrorHandler = (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `No Content found`,
  });
};

//Exports ---------------------------------------------------->
exports.getContent = async (req, res) => {
  try {
    const content = await ContentModel.findOne();

    if (!content) {
      return notFoundErrorHandler(req, res);
    }
    return res.status(200).json({
      status: "success",
      data: {
        content,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};

//------------------------------------------------------------>
exports.createContent = async (req, res) => {
  try {
    //check if one document is already present
    const content = await ContentModel.findOne();
    if (content) {
      return sendErrorMessage(res, 400, "Content already exists");
    }

    //create new content
    const newContent = await ContentModel.create(req.body);

    //send response
    return res.status(201).json({
      status: "success",
      data: {
        content: newContent,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};

//------------------------------------------------------------>
exports.updateContent = async (req, res) => {
  try {
    //Error handling
    const content = await ContentModel.findOne();
    if (!content) {
      return notFoundErrorHandler(req, res);
    }

    //Update content
    content.set(req.body);

    //save content
    const updatedContent = await content.save();

    return res.status(200).json({
      status: "success",
      data: {
        content: updatedContent,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};

//------------------------------------------------------------>
exports.deleteContent = async (req, res) => {
  try {
    const content = await ContentModel.findOneAndDelete();

    if (!content) {
      return notFoundErrorHandler(req, res);
    }
    return res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};
