//imports ----------------------------------------------------->
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const util = require("util");
const UserModel = require("../models/user");
const InCashModel = require("../models/inCash");
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

    if (availableUser) {
      //check if user is not active
      if (!availableUser.active) {
        availableUser.set({
          active: true,
        });

        await availableUser.save();

        return res.status(200).json({
          status: "success",
          message: `Account with email : ${availableUser.email} is reactivated. Please Log in`,
        });
      }

      return sendErrorMessage(
        res,
        400,
        `User with email : ${availableUser.email} already exists`
      );
    }

    //DATABASE OPERATIONS
    const user = await UserModel.create(req.body);

    //generate random verification token
    const accountVerificationToken =
      await user.createAccountVerificationToken();

    //save user with reset token
    await user.save();

    //create reset url
    const backendVerificationURL = `${req.protocol}://${req.get(
      "host"
    )}/auth/verifyEmail/${accountVerificationToken}`;

    //SEND EMAIL
    const mailOptions1 = {
      recipientEmail: req.body.email,
      subject: `Please Verify email address, ${req.body.name} !`,
      text: `Please Verify email address ! Send the request to this url to verify email : ${backendVerificationURL}`,
      html: `Please Verify email address ! Send the request to this url to verify email : ${backendVerificationURL}`,
    };

    await emailHandler.sendEmail(mailOptions1);

    return res.status(200).json({
      status: "success",
      message: `verification token sent to email : ${user.email}`,
    });
  } catch (error) {
    return sendErrorMessage(res, 400, error.message, true);
  }
};

//------------------------------------------------------------>
exports.verifyEmail = async (req, res) => {
  try {
    //get user based on token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await UserModel.findOne({
      accountVerificationToken: hashedToken,
      accountVerificationTokenExpires: { $gt: Date.now() },
    });

    //if token has not expired and there is user, set the new user as verified
    if (!user) {
      return sendErrorMessage(
        res,
        400,
        "Token is invalid or has expired. Please try again"
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

    user.inCashId = inCash._id;

    user.isAccountVerified = true;
    user.accountVerificationToken = undefined;
    user.accountVerificationTokenExpires = undefined;

    await user.save();

    //SEND EMAIL
    const mailOptions = {
      recipientEmail: user.email,
      subject: `Welcome to the family, ${user.name} !`,
      text: `Welcome to the family, ${user.name} !`,
      html: `Welcome to the family,<b> ${user.name}</b> !`,
    };

    await emailHandler.sendEmail(mailOptions);

    return res.status(200).send("Email verified successfully");
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
      return sendErrorMessage(res, 400, "Please provide email and password");
    }

    // Check if user exists && password is correct
    const query = UserModel.findOne({ email }).select("+password +active");

    query.bypassInactiveCheck = true;

    const user = await query;

    if (!user || !(await user.checkPassword(password, user.password))) {
      return sendErrorMessage(res, 401, "Incorrect email or password");
    }

    //check if user is verified
    if (!user.isAccountVerified) {
      return sendErrorMessage(
        res,
        401,
        "Please verify your email address to login"
      );
    }

    //check is user is active
    if (!user.active) {
      user.set({
        active: true,
      });
      await user.save();

      return res.status(200).json({
        status: "success",
        message: `Account with email : ${user.email} is reactivated. Please Log in again`,
      });
    }

    // If everything ok, send token to client
    const token = signToken(user._id);

    user.password = undefined;

    res.cookie("jwt", token, cookieOptions);

    return res.status(200).json({
      status: "success",
      token,
      user,
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

    //INITIALIZE QUERY
    const apiFeatures = new ApiFeatures(
      UserModel.findById(decoded.id),
      req.query
    ).limitFields();

    const currentUser = await apiFeatures.query;

    if (!currentUser) {
      return sendErrorMessage(
        res,
        401,
        "The user belonging to this token no longer exists"
      );
    }

    // Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return sendErrorMessage(
        res,
        401,
        "User recently changed password! Please log in again"
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (error) {
    sendErrorMessage(res, 400, error.message, true);
  }
};

//---------------------------------------------------------------->
exports.forgotPassword = async (req, res, next) => {
  try {
    //get user from email
    const user = await UserModel.findOne({ email: req.body.email });

    //if user does not exist
    if (!user) {
      return sendErrorMessage(res, 404, "No user found with this email");
    }

    //generate random reset token
    const resetToken = await user.createPasswordResetToken();

    //save user with reset token
    await user.save({ validateBeforeSave: false });

    //create reset url
    const frontendUserPasswordResetURL = `${process.env.frontendUserPasswordResetURL}/${resetToken}`;

    //SEND EMAIL
    const mailOptions = {
      recipientEmail: user.email,
      subject: `Pasword reset Token !`,
      text: `Forgot Your Password ? Send the request to this url to reset password : ${frontendUserPasswordResetURL}`,
      html: `Forgot Your Password ? Send the request to this url to reset password : ${frontendUserPasswordResetURL}`,
    };

    await emailHandler.sendEmail(mailOptions);

    //Response
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
    //get user based on token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await UserModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    //if token has not expired and there is user, set the new password
    if (!user) {
      return sendErrorMessage(res, 400, "Token is invalid or has expired");
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    //*update passwordChangedAt property for the user in middleware

    //log the user in, send JWT
    const token = signToken(user._id);

    user.password = undefined;

    return res.status(200).json({
      status: "success",
      token,
      user,
    });
  } catch (error) {
    return sendErrorMessage(res, 400, error.message, true);
  }
};

//---------------------------------------------------------------->
exports.updatePassword = async (req, res, next) => {
  try {
    //get user from collection
    const user = await UserModel.findById(req.user._id).select("+password");

    //check if posted current password is correct
    if (!(await user.checkPassword(req.body.passwordCurrent, user.password))) {
      return sendErrorMessage(res, 401, "Your current password is wrong");
    }

    //if so, update password
    user.password = req.body.password;
    await user.save();

    //log user in, send JWT
    const token = signToken(user._id);
    user.password = undefined;
    return res.status(200).json({
      status: "success",
      token,
      user,
    });
  } catch (error) {
    return sendErrorMessage(res, 400, error.message, true);
  }
};
