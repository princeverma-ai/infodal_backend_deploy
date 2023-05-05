//imports ----------------------------------------------------->
const express = require("express");
const contentConroller = require("../controllers/content");
const adminController = require("../controllers/admin");

//Router ------------------------------------------------------>
const Router = express.Router();

Router.use(
  adminController.protect,
  adminController.restrictTo("super-admin", "admin", "manager")
);

Router.route("/")
  .get(contentConroller.getContent)
  .post(contentConroller.createContent)
  .patch(contentConroller.updateContent)
  .delete(contentConroller.deleteContent);

//Export Router ----------------------------------------------->
module.exports = Router;
