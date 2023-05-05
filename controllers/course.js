//imports ----------------------------------------------------->
const CourseModel = require("../models/course");
const ReviewModel = require("../models/review");
const ApiFeatures = require("../utils/apiFeatures");

const imageHandler = require("../utils/imageHandler");

const { sendErrorMessage } = require("../utils/errorHandler");
const { stripe } = require("../utils/paymentInstance");

//Error Handler----------------------------------------------->
const notFoundErrorHandler = (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `No course found with ID- ${req.params.id}`,
  });
};

//Exports ---------------------------------------------------->
exports.getAllCourses = async (req, res) => {
  try {
    //INITIALIZE QUERY
    const features = new ApiFeatures(CourseModel.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalDocumentsQuery = new ApiFeatures(
      CourseModel.find(),
      req.query
    ).filter().query;

    const totalDocuments = await totalDocumentsQuery.countDocuments();

    //EXECUTE QUERY
    const courses = await features.query;

    //ERROR HANDLING
    if (!courses.length) {
      return sendErrorMessage(res, 404, "No courses found");
    }
    return res.status(200).json({
      status: "success",
      page: req.query.page * 1,
      resultsInThisPage: courses.length,
      totalDocuments,
      data: {
        courses,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//------------------------------------------------------------>
exports.getCourse = async (req, res) => {
  try {
    //INITIALIZE QUERY
    const apiFeatures = new ApiFeatures(
      CourseModel.findById(req.params.id),
      req.query
    ).limitFields();

    //EXECUTE QUERY
    const course = await apiFeatures.query;

    //ERROR HANDLING
    if (!course) {
      return notFoundErrorHandler(req, res);
    }

    return res.status(200).json({
      status: "success",
      data: {
        course,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//------------------------------------------------------------>
exports.createCourse = async (req, res) => {
  try {
    //*Check if all required fields are present
    const requiredFields = Object.keys(CourseModel.schema.paths).filter(
      (path) => CourseModel.schema.paths[path].isRequired
    );

    const documentData = req.body;

    const missingFields = requiredFields.filter(
      (field) => !(field in documentData)
    );

    //removing image object from required fields
    const index = missingFields.indexOf("imageObject");
    if (index > -1) {
      missingFields.splice(index, 1);
    }

    if (missingFields.length > 0) {
      const erroMessage = `Missing fields: ${missingFields.join(", ")}`;
      return sendErrorMessage(res, 400, erroMessage);
    }

    //*All Validation passed------------------------>
    //If image is uploaded
    if (req.file) {
      //Add image
      const img = await imageHandler.addImage(req.file);
      //Add image id to req.body
      req.body.imageObject = { imageId: img._id, imageUrl: img.secure_url };
    } else {
      return sendErrorMessage(res, 400, "Please upload an image");
    }

    //create srtipe product
    const product = await stripe.products.create({
      name: req.body.name,
    });

    //create stripe price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: req.body.price * 100,
      currency: process.env.CURRENCY,
    });

    //add price id to req.body
    req.body.stripePriceId = price.id;

    //Create new course
    const newCourse = await CourseModel.create(req.body);
    return res.status(201).json({
      status: "success",
      data: {
        course: newCourse,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  } finally {
    if (req.file) {
      imageHandler.deleteUnusedImage(req.file);
    }
  }
};

//------------------------------------------------------------>
exports.updateCourse = async (req, res) => {
  try {
    //Find course
    let course = await CourseModel.findById(req.params.id);

    //ERROR HANDLING
    if (!course) {
      return notFoundErrorHandler(req, res);
    }

    //If image is uploaded
    if (req.file) {
      //extract image id from course data
      const imgId = course.imageObject.imageId;

      //replace image
      const img = await imageHandler.replaceImage(req.file, imgId);

      //update image id in req.body
      course.imageObject = { imageId: img._id, imageUrl: img.secure_url };
    }

    //check faq value
    if (req.body.faq && !Array.isArray(req.body.faq)) {
      req.body.faq = [];
    }

    //Update course data
    course.set(req.body);

    //save course
    await course.save();

    return res.status(200).json({
      status: "success",
      data: {
        course,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  } finally {
    if (req.file) {
      imageHandler.deleteUnusedImage(req.file);
    }
  }
};

//------------------------------------------------------------>
exports.deleteCourse = async (req, res) => {
  try {
    const course = await CourseModel.findByIdAndDelete(req.params.id);

    if (!course) {
      return notFoundErrorHandler(req, res);
    }

    //delete image
    await imageHandler.deleteImage(course.imageObject.imageId);

    return res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    return sendErrorMessage(res, 404, err.message);
  }
};

//Review-------------------------------------------------------->
exports.getCourseReviews = async (req, res) => {
  try {
    //INITIALIZE QUERY
    const features = new ApiFeatures(
      ReviewModel.find({ courseId: req.params.id, approved: true }),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    //EXECUTE QUERY
    const reviews = await features.query;

    //ERROR HANDLING
    if (!reviews.length) {
      return sendErrorMessage(res, 404, "No reviews found");
    }

    //SEND RESPONSE
    return res.status(200).json({
      status: "success",
      data: {
        reviews,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 404, err.message);
  }
};

//Bulk Operations-------------------------------------------------------->
exports.bulkUpdateCourses = async (req, res) => {
  try {
    //Filtering
    const queryObj = { ...req.query };

    //Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    const updateResults = await CourseModel.updateMany(
      JSON.parse(queryStr),
      {
        $set: req.body,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      status: "success",
      data: {
        updateResults,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};
