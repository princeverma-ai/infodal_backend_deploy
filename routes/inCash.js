//imports ----------------------------------------------------->
const express = require("express");
const inCashController = require("../controllers/inCash");
const adminController = require("../controllers/admin");
const { objectIdErrorHandler } = require("../utils/errorHandler");

//Router ------------------------------------------------------>
const Router = express.Router();

Router.use(
  adminController.protect,
  adminController.restrictTo("super-admin", "admin")
);

Router.route("/").get(inCashController.getAllInCash);

Router.route("/:id")
  .all(objectIdErrorHandler)
  .get(inCashController.getInCash)
  .patch(inCashController.updateInCash);

//Export Router ----------------------------------------------->
module.exports = Router;
