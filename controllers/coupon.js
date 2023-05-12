//imports ----------------------------------------------------->
const CouponModel = require("../models/coupon");
const ApiFeatures = require("../utils/apiFeatures");
const { sendErrorMessage } = require("../utils/errorHandler");

//Error Handler----------------------------------------------->
const notFoundErrorHandler = (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `No Coupon found with ID- ${req.params.id}`,
  });
};

//Exports ---------------------------------------------------->
exports.getAllCoupons = async (req, res) => {
  try {
    //INITIALIZE QUERY
    const features = new ApiFeatures(CouponModel.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalDocuments = await CouponModel.countDocuments();

    //EXECUTE QUERY
    const coupons = await features.query;

    //ERROR HANDLING
    if (!coupons.length) {
      return sendErrorMessage(res, 404, "No coupons found");
    }

    return res.status(200).json({
      status: "success",
      page: req.query.page * 1,
      resultsInThisPage: coupons.length,
      totalDocuments,
      data: {
        coupons,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};

//------------------------------------------------------------>
exports.getCoupon = async (req, res) => {
  try {
    const coupon = await CouponModel.findById(req.params.id);

    if (!coupon) {
      return notFoundErrorHandler(req, res);
    }

    return res.status(200).json({
      status: "success",
      data: {
        coupon,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};

//------------------------------------------------------------>
exports.createCoupon = async (req, res) => {
  try {
    //create new coupon
    const newCoupon = await CouponModel.create(req.body);

    //send response
    return res.status(201).json({
      status: "success",
      data: {
        coupon: newCoupon,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};

//------------------------------------------------------------>
exports.updateCoupon = async (req, res) => {
  try {
    //Error handling
    const coupon = await CouponModel.findById(req.params.id);
    if (!coupon) {
      return notFoundErrorHandler(req, res);
    }

    //Update coupon
    coupon.set(req.body);

    //save coupon
    const updatedCoupon = await coupon.save();

    return res.status(200).json({
      status: "success",
      data: {
        coupon: updatedCoupon,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};

//------------------------------------------------------------>
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await CouponModel.findByIdAndDelete(req.params.id);

    if (!coupon) {
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
