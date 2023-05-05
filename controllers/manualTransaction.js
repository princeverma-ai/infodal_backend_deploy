//imports ----------------------------------------------------->
const ManualTransactionModel = require("../models/manualTransaction");
const ApiFeatures = require("../utils/apiFeatures");
const { sendErrorMessage } = require("../utils/errorHandler");

//Error Handler----------------------------------------------->
const notFoundErrorHandler = (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `No Manual Transaction found with ID- ${req.params.id}`,
  });
};

//Exports ---------------------------------------------------->
exports.getAllTransactions = async (req, res) => {
  try {
    //INITIALIZE QUERY
    const features = new ApiFeatures(ManualTransactionModel.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalDocuments = await ManualTransactionModel.countDocuments();

    //EXECUTE QUERY
    const manualTransactions = await features.query;

    //ERROR HANDLING
    if (!manualTransactions.length) {
      return sendErrorMessage(res, 404, "No Manual Transctions found");
    }

    return res.status(200).json({
      status: "success",
      page: req.query.page * 1,
      resultsInThisPage: manualTransactions.length,
      totalDocuments,
      data: {
        manualTransactions,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//------------------------------------------------------------>
exports.getTransaction = async (req, res) => {
  try {
    const manualTransaction = await ManualTransactionModel.findById(
      req.params.id
    );
    return res.status(200).json({
      status: "success",
      data: {
        manualTransaction,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//------------------------------------------------------------>
exports.createTransaction = async (req, res) => {
  try {
    //*Check if all required fields are present
    const requiredFields = Object.keys(
      ManualTransactionModel.schema.paths
    ).filter((path) => ManualTransactionModel.schema.paths[path].isRequired);

    const documentData = req.body;

    const missingFields = requiredFields.filter(
      (field) => !(field in documentData)
    );

    if (missingFields.length > 0) {
      const erroMessage = `Missing fields: ${missingFields.join(", ")}`;
      return sendErrorMessage(res, 400, erroMessage);
    }

    //create new manualTransaction
    const newManualTransaction = await ManualTransactionModel.create(req.body);

    //send response
    return res.status(201).json({
      status: "success",
      data: {
        manualTransaction: newManualTransaction,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//------------------------------------------------------------>
exports.updateTransaction = async (req, res) => {
  try {
    //Error handling
    const manualTransaction = await ManualTransactionModel.findById(
      req.params.id
    );
    if (!manualTransaction) {
      return notFoundErrorHandler(req, res);
    }

    //Update manualTransaction
    manualTransaction.set(req.body);

    //save manualTransaction
    const updatedManualTransaction = await manualTransaction.save();

    return res.status(200).json({
      status: "success",
      data: {
        manualTransaction: updatedManualTransaction,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//------------------------------------------------------------>
exports.deleteTransaction = async (req, res) => {
  try {
    const manualTransaction = await ManualTransactionModel.findByIdAndDelete(
      req.params.id
    );

    if (!manualTransaction) {
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
