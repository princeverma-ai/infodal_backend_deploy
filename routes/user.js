//imports ----------------------------------------------------->
const express = require("express");
const adminController = require("../controllers/admin");
const authController = require("../controllers/auth");
const userController = require("../controllers/user");

//Router ------------------------------------------------------>
const Router = express.Router();

Router.route("/all").get(userController.getAllUsers);

//*Admin Controlled User Routes ---------------------------------->

Router.route("/adminControl")
  .post(
    adminController.protect,
    adminController.restrictTo("super-admin", "admin"),
    userController.adminAddUser
  )
  .patch(
    adminController.protect,
    adminController.restrictTo("super-admin", "admin"),
    userController.adminUpdateUser
  )
  .delete(
    adminController.protect,
    adminController.restrictTo("super-admin", "admin"),
    userController.adminDeleteUser
  );

Router.route("/adminControl/getDeactivatedUsers").get(
  adminController.protect,
  adminController.restrictTo("super-admin", "admin"),
  userController.getDeactivatedUsers
);

//*User Controlled Routes --------------------------------------->
Router.use(authController.protect);

Router.route("/")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.setUserInactive);

Router.route("/cart")
  .post(userController.addToCart)
  .patch(userController.removeFromCart);

Router.route("/transaction").get(userController.getUserTransactions);

Router.route("/getUserInCash").get(userController.getUserInCash);

//Export Router ----------------------------------------------->
module.exports = Router;
