//imports ----------------------------------------------------->
const express = require("express");
const authController = require("../controllers/auth");

//Router ------------------------------------------------------>
const Router = express.Router();

Router.route("/signup").post(authController.signup);
Router.route("/login").post(authController.login);

Router.route("/verifyEmail/:token").get(authController.verifyEmail);

Router.route("/forgotPassword").post(authController.forgotPassword);
Router.route("/resetPassword/:token").patch(authController.resetPassword);

Router.route("/updatePassword").patch(
  authController.protect,
  authController.updatePassword
);

//Export Router ----------------------------------------------->
module.exports = Router;
