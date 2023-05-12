//imports ----------------------------------------------------->
const mongoose = require("mongoose");
const ReviewModel = require("../models/review");
const CourseModel = require("../models/course");
const ApiFeatures = require("../utils/apiFeatures");
const { sendErrorMessage } = require("../utils/errorHandler");

//Error Handler----------------------------------------------->
const notFoundErrorHandler = (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `No Review found with ID- ${req.params.id}`,
  });
};

//Exports ---------------------------------------------------->
exports.getAllReviews = async (req, res) => {
  try {
    //INITIALIZE QUERY
    const features = new ApiFeatures(ReviewModel.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalDocuments = await ReviewModel.countDocuments();

    //EXECUTE QUERY
    const reviews = await features.query;

    //ERROR HANDLING
    if (!reviews.length) {
      return sendErrorMessage(res, 404, "No reviews found");
    }

    //SEND RESPONSE
    return res.status(200).json({
      status: "success",
      page: req.query.page * 1,
      resultsInThisPage: reviews.length,
      totalDocuments,
      data: {
        reviews,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};

//------------------------------------------------------------>
exports.getReview = async (req, res) => {
  try {
    const review = await ReviewModel.findById(req.params.id);

    //ERROR HANDLING
    if (!review) {
      return notFoundErrorHandler(req, res);
    }

    return res.status(200).json({
      status: "success",
      data: {
        review,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};

//------------------------------------------------------------>
exports.createReview = async (req, res) => {
  try {
    const newReview = await ReviewModel.create(req.body);
    return res.status(201).json({
      status: "success",
      data: {
        review: newReview,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};

//------------------------------------------------------------>
exports.updateReview = async (req, res) => {
  try {
    const review = await ReviewModel.findById(req.params.id);

    //ERROR HANDLING
    if (!review) {
      return notFoundErrorHandler(req, res);
    }

    //check if course id is valid or not
    if (!mongoose.isValidObjectId(req.body.courseId)) {
      return sendErrorMessage(res, 400, "Invalid Course ID");
    }

    //check if course exists or not
    const course = CourseModel.findById(req.body.courseId);

    if (!course) {
      return sendErrorMessage(res, 400, "No course found with this ID");
    }

    //update review
    review.set(req.body);

    //save review
    await review.save();

    //get all of reviews
    const reviews = await ReviewModel.find({
      courseId: course._id,
      approved: true,
    });

    //calculate new average rating
    let newRating = 0;
    reviews.forEach((review) => {
      newRating += review.rating;
    });

    newRating = newRating / reviews.length;

    course.rating = newRating;

    await course.save();

    return res.status(200).json({
      status: "success",
      data: {
        review,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};

//------------------------------------------------------------>
exports.deleteReview = async (req, res) => {
  try {
    const review = await ReviewModel.findByIdAndDelete(req.params.id);

    //ERROR HANDLING
    if (!review) {
      return notFoundErrorHandler(req, res);
    }

    //change average rating
    const course = await CourseModel.findById(review.courseId);

    //get all of reviews
    const reviews = await ReviewModel.find({
      courseId: course._id,
      approved: true,
    });

    //calculate new average rating
    let newRating = 0;
    reviews.forEach((review) => {
      newRating += review.rating;
    });

    newRating = newRating / reviews.length;

    course.rating = newRating;

    await course.save();

    return res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message, true);
  }
};
