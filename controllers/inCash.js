//imports ----------------------------------------------------->
const InCashModel = require("../models/inCash");
const ApiFeatures = require("../utils/apiFeatures");
const { sendErrorMessage } = require("../utils/errorHandler");

//Error Handler----------------------------------------------->
const notFoundErrorHandler = (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `No InCash found with ID- ${req.params.id}`,
  });
};

//Exports ---------------------------------------------------->
exports.getAllInCash = async (req, res) => {
  try {
    //INITIALIZE QUERY
    const features = new ApiFeatures(InCashModel.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalDocuments = await InCashModel.countDocuments();

    //EXECUTE QUERY
    const inCash = await features.query;

    //ERROR HANDLING
    if (!inCash.length) {
      return sendErrorMessage(res, 404, "No inCash found");
    }

    return res.status(200).json({
      status: "success",
      page: req.query.page * 1,
      resultsInThisPage: inCash.length,
      totalDocuments,
      data: {
        inCash,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};

//------------------------------------------------------------>
exports.getInCash = async (req, res) => {
  try {
    const inCash = await InCashModel.findById(req.params.id);

    if (!inCash) {
      return notFoundErrorHandler(req, res);
    }

    return res.status(200).json({
      status: "success",
      data: {
        inCash,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};

//------------------------------------------------------------>
exports.updateInCash = async (req, res) => {
  try {
    //Error handling
    const inCash = await InCashModel.findById(req.params.id);
    if (!inCash) {
      return notFoundErrorHandler(req, res);
    }

    //Update inCash
    inCash.set(req.body);

    //save inCash
    const updatedInCash = await inCash.save();

    return res.status(200).json({
      status: "success",
      data: {
        inCash: updatedInCash,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};
