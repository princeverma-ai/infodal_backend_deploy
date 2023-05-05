//imports ----------------------------------------------------->
const WebFormModel = require("../models/webForm");
const ApiFeatures = require("../utils/apiFeatures");
const emailHandler = require("../utils/emailHandler");
const { sendErrorMessage } = require("../utils/errorHandler");

//Error Handler----------------------------------------------->
const notFoundErrorHandler = (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `No WebForm found with ID- ${req.params.id}`,
  });
};

//Exports ---------------------------------------------------->
exports.getAllWebForms = async (req, res) => {
  try {
    //INITIALIZE QUERY
    const features = new ApiFeatures(WebFormModel.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalDocuments = await WebFormModel.countDocuments();

    //EXECUTE QUERY
    const webforms = await features.query;

    //ERROR HANDLING
    if (!webforms.length) {
      return sendErrorMessage(res, 404, "No webforms found");
    }

    return res.status(200).json({
      status: "success",
      page: req.query.page * 1,
      resultsInThisPage: webforms.length,
      totalDocuments,
      data: {
        webforms,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//------------------------------------------------------------>
exports.getWebForm = async (req, res) => {
  try {
    const webform = await WebFormModel.findById(req.params.id);

    if (!webform) {
      return notFoundErrorHandler(req, res);
    }
    return res.status(200).json({
      status: "success",
      data: {
        webform,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//------------------------------------------------------------>
exports.createWebForm = async (req, res) => {
  try {
    //create new webform
    const newWebForm = await WebFormModel.create(req.body);

    //send email to recipient
    const mailOptions = {
      recipientEmail: req.body.email,
      subject: `Thanks for Submision - Infodal`,
      text: "Thanks for Submision - Infodal",
      html: `Thanks for Submision - Infodal`,
    };

    await emailHandler.sendEmail(mailOptions);

    //send email to sender
    const mailOptions2 = {
      recipientEmail: process.env.DOMAIN_EMAIL,
      subject: `Web Form Submission from - ${req.body.name}`,
      text: `Web Form Submission from - ${req.body.name}`,
      html: `Web Form Submission from - ${req.body.name}`,
    };
    await emailHandler.sendEmail(mailOptions2);

    //send response
    return res.status(201).json({
      status: "success",
      data: {
        webForm: newWebForm,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//------------------------------------------------------------>
exports.updateWebForm = async (req, res) => {
  try {
    //Error handling
    const webForm = await WebFormModel.findById(req.params.id);
    if (!webForm) {
      return notFoundErrorHandler(req, res);
    }

    //Update webform
    webForm.set(req.body);

    //save webform
    const updatedWebForm = await webForm.save();

    return res.status(200).json({
      status: "success",
      data: {
        webForm: updatedWebForm,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//------------------------------------------------------------>
exports.deleteWebForm = async (req, res) => {
  try {
    const webForm = await WebFormModel.findByIdAndDelete(req.params.id);

    if (!webForm) {
      return notFoundErrorHandler(req, res);
    }
    return res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};
