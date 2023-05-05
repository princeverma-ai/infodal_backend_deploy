//imports ----------------------------------------------------->
const express = require("express");
const authAdminController = require("../controllers/admin");

//Router ------------------------------------------------------>
const Router = express.Router();

Router.route("/signup").post(authAdminController.signup);
Router.route("/login").post(authAdminController.login);

Router.route("/verifyEmail/:token").get(authAdminController.verifyEmail);
Router.route("/verifyAdmin/:token").get(authAdminController.verifyAdmin);

Router.route("/forgotPassword").post(authAdminController.forgotPassword);
Router.route("/resetPassword/:token").patch(authAdminController.resetPassword);

Router.use(authAdminController.protect);

Router.route("/updatePassword").patch(authAdminController.updatePassword);

Router.route("/")
  .get(authAdminController.getAdmin)
  .patch(authAdminController.updateAdmin)
  .delete(authAdminController.deleteAdmin);

//Export Router ----------------------------------------------->
module.exports = Router;
