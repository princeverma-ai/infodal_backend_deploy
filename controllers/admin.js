//imports ----------------------------------------------------->
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const util = require("util");
const AdminModel = require("../models/admin");
const emailHandler = require("../utils/emailHandler");
const { sendErrorMessage } = require("../utils/errorHandler");
const ApiFeatures = require("../utils/apiFeatures");

//Secret key -------------------------------------------------->
const secretKey = process.env.JWT_SECRET_KEY;

//Sign token -------------------------------------------------->
const signToken = (id) => {
  return jwt.sign({ id }, secretKey, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//cookie options --------------------------------------------->
const cookieOptions = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000
  ),
  httpOnly: true,

  //*Only send cookie over https in production
  secure: process.env.NODE_ENV === "production" ? true : false,
};

//Exports ---------------------------------------------------->
exports.signup = async (req, res) => {
  try {
    //check if admin already exists
    const adminCount = await AdminModel.find().countDocuments();

    if (adminCount > process.env.MAX_ADMIN_COUNT) {
      return sendErrorMessage(res, 400, "Admin limit reached");
    }

    //*Check if all required fields are present
    const requiredFields = Object.keys(AdminModel.schema.paths).filter(
      (path) => AdminModel.schema.paths[path].isRequired
    );

    const documentData = req.body;

    const missingFields = requiredFields.filter(
      (field) => !(field in documentData)
    );

    if (missingFields.length > 0) {
      const erroMessage = `Missing fields: ${missingFields.join(", ")}`;
      return sendErrorMessage(res, 400, erroMessage);
    }

    //DATABASE OPERATIONS
    const admin = await AdminModel.create(req.body);

    //generate random verification token
    const accountVerificationToken =
      await admin.createAccountVerificationToken();

    //create admin verification token
    const adminVerificationToken = await admin.createAdminVerificationToken();

    //save admin with reset token
    await admin.save();

    //create account verification url
    const backendVerificationURL = `${req.protocol}://${req.get(
      "host"
    )}/admin/verifyEmail/${accountVerificationToken}`;

    //create admin verification url
    const adminVerificationURL = `${req.protocol}://${req.get(
      "host"
    )}/admin/verifyAdmin/${adminVerificationToken}`;

    //SEND EMAIL
    const mailOptions1 = {
      recipientEmail: req.body.email,
      subject: `Verify email address - ${req.body.name}!`,
      text: `Please Verify email address ! Send the request to this url to verify email : ${backendVerificationURL}`,
      html: `Please Verify email address ! Send the request to this url to verify email : ${backendVerificationURL}`,
    };

    await emailHandler.sendEmail(mailOptions1);

    //SEND EMAIL
    const mailOptions2 = {
      recipientEmail: process.env.DOMAIN_EMAIL,
      subject: `Admin Creation Request - ${req.body.name}!`,
      text: `Please Verify admin creation request from ${req.body.email} with role - ${req.body.role} ! Send the request to this url to verify admin : ${adminVerificationURL}`,
      html: `Please Verify admin creation request from ${req.body.email} with role - ${req.body.role} ! Send the request to this url to verify admin : ${adminVerificationURL}`,
    };

    await emailHandler.sendEmail(mailOptions2);

    return res.status(200).json({
      status: "success",
      message: `verification token sent to email : ${admin.email}`,
    });
  } catch (error) {
    return sendErrorMessage(res, 400, error.message, true);
  }
};

//------------------------------------------------------------>
exports.verifyEmail = async (req, res) => {
  try {
    //get admin based on token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const admin = await AdminModel.findOne({
      accountVerificationToken: hashedToken,
      accountVerificationTokenExpires: { $gt: Date.now() },
    });

    //if token has not expired and there is admin, set the new admin as verified
    if (!admin) {
      return sendErrorMessage(res, 400, "Token is invalid or has expired");
    }

    admin.isAccountVerified = true;
    admin.accountVerificationToken = undefined;
    admin.accountVerificationTokenExpires = undefined;

    await admin.save();

    return res.status(200).send("Email verified successfully");
  } catch (error) {
    return sendErrorMessage(res, 400, error.message, true);
  }
};

//------------------------------------------------------------>
exports.verifyAdmin = async (req, res) => {
  try {
    //get admin based on token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const admin = await AdminModel.findOne({
      adminVerificationToken: hashedToken,
      adminVerificationTokenExpires: { $gt: Date.now() },
    });

    //if token has not expired and there is admin, set the new admin as verified
    if (!admin) {
      return sendErrorMessage(res, 400, "Token is invalid or has expired");
    }

    admin.isAdminVerified = true;
    admin.adminVerificationToken = undefined;
    admin.adminVerificationTokenExpires = undefined;

    await admin.save();

    return res.status(200).send("Admin verified successfully");
  } catch (error) {
    return sendErrorMessage(res, 400, error.message, true);
  }
};

//------------------------------------------------------------>

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return sendErrorMessage(res, 400, "Please provide email and password!");
    }

    // Check if admin exists && password is correct
    const admin = await AdminModel.findOne({ email }).select("+password");

    if (!admin || !(await admin.checkPassword(password, admin.password))) {
      return sendErrorMessage(res, 401, "Incorrect email or password");
    }

    //check if user is verified
    if (!admin.isAccountVerified) {
      return sendErrorMessage(
        res,
        401,
        "Please verify your email address to login"
      );
    }

    if (!admin.isAdminVerified) {
      return sendErrorMessage(
        res,
        401,
        "Please wait for admin to verify your account"
      );
    }

    // If everything ok, send token to client
    const token = signToken(admin._id);

    admin.password = undefined;

    res.cookie("jwt", token, cookieOptions);

    return res.status(200).json({
      status: "success",
      token,
      admin,
    });
  } catch (error) {
    return sendErrorMessage(res, 400, error.message, true);
  }
};

//------------------------------------------------------------>
exports.protect = async (req, res, next) => {
  try {
    // Getting token and check of it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return sendErrorMessage(res, 401, "You are not logged in! Please log in");
    }

    //  Verification token
    const decoded = await util.promisify(jwt.verify)(token, secretKey);

    //  Check if admin still exists
    //INITIALIZE QUERY
    const apiFeatures = new ApiFeatures(
      AdminModel.findById(decoded.id),
      req.query
    ).limitFields();

    //EXECUTE QUERY
    const currentAdmin = await apiFeatures.query;

    if (!currentAdmin) {
      return sendErrorMessage(
        res,
        401,
        "The admin belonging to this token does no longer exist"
      );
    }

    // Check if admin changed password after the token was issued
    if (currentAdmin.changedPasswordAfter(decoded.iat)) {
      return sendErrorMessage(
        res,
        401,
        "Admin recently changed password! Please log in again"
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.admin = currentAdmin;
    next();
  } catch (error) {
    return sendErrorMessage(res, 400, error.message, true);
  }
};

//---------------------------------------------------------------->
exports.forgotPassword = async (req, res, next) => {
  try {
    //get admin from email
    const admin = await AdminModel.findOne({ email: req.body.email });

    //if admin does not exist
    if (!admin) {
      return sendErrorMessage(res, 404, "No admin found with this email");
    }

    //generate random reset token
    const resetToken = await admin.createPasswordResetToken();

    //save admin with reset token
    await admin.save({ validateBeforeSave: false });

    //frotend reset url
    const frontendAdminPasswordResetURL = `${process.env.frontendAdminPasswordResetURL}/${resetToken}`;

    //SEND EMAIL
    const mailOptions = {
      recipientEmail: admin.email,
      subject: `Pasword reset Token !`,
      text: `Forgot Your Password ? Send the request to this url to reset password : ${frontendAdminPasswordResetURL}`,
      html: `Forgot Your Password ? Send the request to this url to reset password : ${frontendAdminPasswordResetURL}`,
    };

    await emailHandler.sendEmail(mailOptions);

    return res.status(200).json({
      status: "success",
      message: "Reset Token sent to email",
    });
  } catch (error) {
    return sendErrorMessage(res, 400, error.message, true);
  }
};

//---------------------------------------------------------------->
exports.resetPassword = async (req, res, next) => {
  try {
    //get admin based on token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const admin = await AdminModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    //if token has not expired and there is admin, set the new password
    if (!admin) {
      return sendErrorMessage(res, 400, "Token is invalid or has expired");
    }

    admin.password = req.body.password;
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;

    await admin.save();

    //*update passwordChangedAt property for the admin in middleware

    //log the admin in, send JWT
    const token = signToken(admin._id);

    admin.password = undefined;

    return res.status(200).json({
      status: "success",
      token,
      admin,
    });
  } catch (error) {
    return sendErrorMessage(res, 400, error.message, true);
  }
};

//---------------------------------------------------------------->
exports.updatePassword = async (req, res, next) => {
  try {
    //get admin from collection
    const admin = await AdminModel.findById(req.admin._id).select("+password");

    //check if posted current password is correct
    if (
      !(await admin.checkPassword(req.body.passwordCurrent, admin.password))
    ) {
      return sendErrorMessage(res, 401, "Your current password is wrong");
    }

    //if so, update password
    admin.password = req.body.password;
    await admin.save();

    //log admin in, send JWT
    const token = signToken(admin._id);
    admin.password = undefined;
    return res.status(200).json({
      status: "success",
      token,
      admin,
    });
  } catch (error) {
    return sendErrorMessage(res, 400, error.message, true);
  }
};

//---------------------------------------------------------------->
exports.getAdmin = async (req, res, next) => {
  try {
    return res.status(200).json({
      status: "success",
      admin: req.admin,
    });
  } catch (error) {
    return sendErrorMessage(res, 401, error.message, true);
  }
};

//---------------------------------------------------------------->
exports.updateAdmin = async (req, res, next) => {
  try {
    //Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return sendErrorMessage(
        res,
        400,
        "This route is not for password updates. Please use /updatePassword"
      );
    }

    //Update admin document
    const updatedAdmin = await AdminModel.findByIdAndUpdate(
      req.admin._id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      status: "success",
      admin: updatedAdmin,
    });
  } catch (error) {
    sendErrorMessage(res, 400, error.message, true);
  }
};

//---------------------------------------------------------------->
exports.deleteAdmin = async (req, res, next) => {
  try {
    await AdminModel.findByIdAndDelete(req.admin._id);

    //send email to admin
    const mailOptions = {
      recipientEmail: req.admin.email,
      subject: `Your Admin Account has been deleted`,
      text: `Your Admin Account has been deleted`,
      html: `Your Admin Account has been deleted`,
    };

    await emailHandler.sendEmail(mailOptions);

    return res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    return sendErrorMessage(res, 400, error.message, true);
  }
};

//---------------------------------------------------------------->
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return sendErrorMessage(
        res,
        403,
        "You do not have permission to perform this action"
      );
    }
    next();
  };
};
