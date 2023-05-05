//imports ----------------------------------------------------->
const express = require("express");
const reviewController = require("../controllers/review");
const adminController = require("../controllers/admin");
const { objectIdErrorHandler } = require("../utils/errorHandler");

//Router ------------------------------------------------------>
const Router = express.Router();

Router.route("/")
  .get(reviewController.getAllReviews)
  .post(reviewController.createReview);

Router.route("/:id")
  .all(objectIdErrorHandler)
  .get(reviewController.getReview)
  .patch(
    adminController.protect,
    adminController.restrictTo("super-admin", "admin", "manager"),
    reviewController.updateReview
  )
  .delete(
    adminController.protect,
    adminController.restrictTo("super-admin", "admin", "manager"),
    reviewController.deleteReview
  );

//Export Router ----------------------------------------------->
module.exports = Router;
