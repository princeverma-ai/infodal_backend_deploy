//imports ----------------------------------------------------->
const mongoose = require("mongoose");
const UserModel = require("../models/user");
const CourseModel = require("../models/course");
const TransactionModel = require("../models/transaction");
const ApiFeatures = require("../utils/apiFeatures");
const emailHandler = require("../utils/emailHandler");
const InCashModel = require("../models/inCash");

const { sendErrorMessage } = require("../utils/errorHandler");

//Exports ---------------------------------------------------->
exports.getAllUsers = async (req, res) => {
  try {
    //INITIALIZE QUERY
    const features = new ApiFeatures(UserModel.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalDocuments = await UserModel.countDocuments({ active: true });

    //POPULATE
    if (req.query.populateFields) {
      features.query.populateFields = true;
    }

    //EXECUTE QUERY
    const users = await features.query;

    //ERROR HANDLING
    if (!users.length) {
      return sendErrorMessage(res, 404, "No users found");
    }

    //SEND RESPONSE
    return res.status(200).json({
      status: "success",
      page: req.query.page * 1,
      resultsInThisPage: users.length,
      totalDocuments,
      data: {
        users,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//------------------------------------------------------------>
exports.getUser = async (req, res) => {
  try {
    return res.status(200).json({
      status: "success",
      data: {
        user: req.user,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//------------------------------------------------------------>
exports.updateUser = async (req, res) => {
  try {
    //Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return sendErrorMessage(
        res,
        400,
        "This route is not for password updates. Please use /updateMyPassword"
      );
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    return res.status(200).json({
      status: "success",
      data: {
        updatedUser,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//------------------------------------------------------------>
exports.setUserInactive = async (req, res) => {
  try {
    await UserModel.findByIdAndUpdate(req.user.id, { active: false });
    //send email to user
    const mailOptions = {
      recipientEmail: req.user.email,
      subject: `Your account has been deactivated`,
      text: `Your account has been deactivated`,
      html: `Your account has been deactivated`,
    };

    await emailHandler.sendEmail(mailOptions);

    return res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//CART -------------------------------------------------------->
exports.addToCart = async (req, res) => {
  try {
    //check if course id is present in request body
    if (!req.body.courseId) {
      return sendErrorMessage(res, 400, "course id is required");
    }

    //check if course id is valid mongoose id
    if (!mongoose.Types.ObjectId.isValid(req.body.courseId)) {
      return sendErrorMessage(res, 400, "course id is not valid");
    }

    //get course id from request body
    const courseId = req.body.courseId;

    //get user from request
    const user = req.user;

    //check if course is already in cart
    const courseInCart = user.cartItems.find(
      (course) => course._id.toString() === courseId.toString()
    );

    //if course is already in cart
    if (courseInCart) {
      //return response
      return res.status(200).json({
        status: "success",
        message: "course already in cart",
      });
    } else {
      //check if course with that id exists
      const course = await CourseModel.findById(courseId);

      //if course does not exist
      if (!course) {
        return sendErrorMessage(res, 404, "course not found");
      }

      //add course to cart
      user.cartItems.push(courseId);
    }

    //save user
    await user.save();

    //send response
    return res.status(200).json({
      status: "success",
      message: `course - ${courseId} added to cart`,
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//------------------------------------------------------------>
exports.removeFromCart = async (req, res) => {
  try {
    //get course id from request body
    const courseId = req.body.courseId;

    //get user from request
    const user = req.user;

    //check if course is in cart
    const courseInCart = user.cartItems.find(
      (course) => course._id.toString() === courseId.toString()
    );

    //if course is in cart
    if (courseInCart) {
      //remove course from cart
      user.cartItems = user.cartItems.filter(
        (course) => course._id.toString() !== courseId.toString()
      );
    } else {
      //return response
      return sendErrorMessage(res, 404, "course not in cart");
    }

    //save user
    await user.save();

    //send response
    return res.status(200).json({
      status: "success",
      message: `course - ${courseId} removed from cart`,
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//Transaction ------------------------------------------------->
exports.getUserTransactions = async (req, res) => {
  try {
    //getting transactions from transactions model for particular user
    const transactions = await TransactionModel.find({ userId: req.user._id });

    //*GET TRANSACTION DETAILS FROM RAZORPAY API
    // const transactionPromiseArray = transactions.map((transaction) =>
    //   instance.orders.fetch(transaction.razorpay_order_id)
    // );

    // const transactionDetails = await Promise.all(transactionPromiseArray);

    //POPULATING COURSES IN TRANSACTION ARRAY

    //Error handling
    if (!transactions.length) {
      return sendErrorMessage(res, 404, "No transactions found");
    }

    //SENDING RESPONSE
    return res.status(200).json({
      status: "success",
      data: {
        transactions: transactions,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//------------------------------------------------------------>
exports.getUserInCash = async (req, res) => {
  try {
    //Get incash from incash model
    const incash = await InCashModel.findById(req.user.inCashId);

    //Error handling
    if (!incash) {
      return sendErrorMessage(res, 404, "No incash found");
    }
    //SENDING RESPONSE
    return res.status(200).json({
      status: "success",
      data: {
        incash: incash,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//---------------------------------------------------------------->
exports.adminAddUser = async (req, res, next) => {
  try {
    //*Check if all required fields are present
    const requiredFields = Object.keys(UserModel.schema.paths).filter(
      (path) => UserModel.schema.paths[path].isRequired
    );

    const documentData = req.body;

    const missingFields = requiredFields.filter(
      (field) => !(field in documentData)
    );

    if (missingFields.length > 0) {
      const erroMessage = `Missing fields: ${missingFields.join(", ")}`;
      return sendErrorMessage(res, 400, erroMessage);
    }

    //check if email is already present in database
    const query = UserModel.findOne({
      email: req.body.email,
    }).select("+active");
    query.bypassInactiveCheck = true;
    const availableUser = await query;

    console.log(availableUser);

    if (availableUser) {
      //check if user is not active
      if (!availableUser.active) {
        return sendErrorMessage(
          res,
          400,
          `Account with email : ${availableUser.email} has deactivated their account`
        );
      }

      return sendErrorMessage(
        res,
        400,
        `User with email : ${availableUser.email} already exists`
      );
    }

    //create new InCash
    const inCash = await InCashModel.create({
      inCashAmount: process.env.DEFAULT_INCASH_AMOUNT,
      expiryDate:
        Date.now() +
        process.env.DEFAULT_INCASH_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      startDate: Date.now(),
    });

    const user = await UserModel.create({
      ...req.body,
      isAccountVerified: true,
      inCashId: inCash._id,
    });

    user.password = undefined;

    return res.status(201).json({
      status: "success",
      user,
    });
  } catch (error) {
    return sendErrorMessage(res, 400, error.message);
  }
};

//---------------------------------------------------------------->
exports.adminUpdateUser = async (req, res) => {
  try {
    //Create error if user POSTs password data
    if (req.body.password) {
      return sendErrorMessage(res, 400, "You cannot change password of user");
    }

    const query = UserModel.findById(req.body.userId);

    //POPULATE
    if (req.query.populateFields) {
      query.populateFields = true;
    }

    const user = await query;

    if (!user) {
      return sendErrorMessage(res, 404, "User not found");
    }

    //Update user document
    user.set(req.body);

    //Save user document
    await user.save();

    return res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//---------------------------------------------------------------->
exports.adminDeleteUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.body.userId);

    if (!user) {
      return sendErrorMessage(res, 404, "User not found");
    }

    user.set({ active: false });

    await user.save();

    return res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};

//Exports ---------------------------------------------------->
exports.getDeactivatedUsers = async (req, res) => {
  try {
    //INITIALIZE QUERY
    const features = new ApiFeatures(
      UserModel.find({ active: false }),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    features.query.bypassInactiveCheck = true;

    //EXECUTE QUERY
    const users = await features.query;

    //ERROR HANDLING
    if (!users.length) {
      return sendErrorMessage(res, 404, "No users found");
    }

    //SEND RESPONSE
    return res.status(200).json({
      status: "success",
      page: req.query.page * 1,
      resultsInThisPage: users.length,
      data: {
        users,
      },
    });
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};
