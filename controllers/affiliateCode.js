//imports ----------------------------------------------------->
const AffiliateCodeModel = require("../models/affiliateCode");
const ApiFeatures = require("../utils/apiFeatures");
const { sendErrorMessage } = require("../utils/errorHandler");

//Error Handler----------------------------------------------->
const notFoundErrorHandler = (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `No AffiliateCode found with ID- ${req.params.id}`,
  });
};

//Exports ---------------------------------------------------->
exports.getAllAffiliateCodes = async (req, res) => {
  try {
    //INITIALIZE QUERY
    const features = new ApiFeatures(AffiliateCodeModel.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalDocuments = await AffiliateCodeModel.countDocuments();

    //EXECUTE QUERY
    const affiliateCodes = await features.query;

    //ERROR HANDLING
    if (!affiliateCodes.length) {
      return sendErrorMessage(res, 404, "No affiliateCodes found");
    }

    return res.status(200).json({
      status: "success",
      page: req.query.page * 1,
      resultsInThisPage: affiliateCodes.length,
      totalDocuments,
      data: {
        affiliateCodes,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};

//------------------------------------------------------------>
exports.getAffiliateCode = async (req, res) => {
  try {
    const affiliateCode = await AffiliateCodeModel.findById(req.params.id);

    if (!affiliateCode) {
      return notFoundErrorHandler(req, res);
    }

    return res.status(200).json({
      status: "success",
      data: {
        affiliateCode,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};

//------------------------------------------------------------>
exports.createAffiliateCode = async (req, res) => {
  try {
    //create new affiliateCode
    const newAffiliateCode = await AffiliateCodeModel.create(req.body);

    //send response
    return res.status(201).json({
      status: "success",
      data: {
        affiliateCode: newAffiliateCode,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};

//------------------------------------------------------------>
exports.updateAffiliateCode = async (req, res) => {
  try {
    //Error handling
    const affiliateCode = await AffiliateCodeModel.findById(req.params.id);
    if (!affiliateCode) {
      return notFoundErrorHandler(req, res);
    }

    //Update affiliateCode
    affiliateCode.set(req.body);

    //save affiliateCode
    const updateAffiliateCode = await affiliateCode.save();

    return res.status(200).json({
      status: "success",
      data: {
        affiliateCode: updateAffiliateCode,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};

//------------------------------------------------------------>
exports.deleteAffiliateCode = async (req, res) => {
  try {
    const affiliateCode = await AffiliateCodeModel.findByIdAndDelete(
      req.params.id
    );

    if (!affiliateCode) {
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
