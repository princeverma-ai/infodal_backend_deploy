//imports ----------------------------------------------------->
const express = require("express");
const webFormController = require("../controllers/webForm");
const adminController = require("../controllers/admin");
const { objectIdErrorHandler } = require("../utils/errorHandler");

//Router ------------------------------------------------------>
const Router = express.Router();

Router.route("/")
  .get(
    adminController.protect,
    adminController.restrictTo("super-admin", "admin"),
    webFormController.getAllWebForms
  )
  .post(webFormController.createWebForm);

Router.use(
  adminController.protect,
  adminController.restrictTo("super-admin", "admin")
);

Router.route("/:id")
  .all(objectIdErrorHandler)
  .get(webFormController.getWebForm)
  .patch(webFormController.updateWebForm)
  .delete(webFormController.deleteWebForm);

//Export Router ----------------------------------------------->
module.exports = Router;
