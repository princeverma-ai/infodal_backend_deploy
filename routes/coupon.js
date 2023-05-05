//imports ----------------------------------------------------->
const express = require("express");
const couponController = require("../controllers/coupon");
const adminController = require("../controllers/admin");
const { objectIdErrorHandler } = require("../utils/errorHandler");

//Router ------------------------------------------------------>
const Router = express.Router();

Router.use(
  adminController.protect,
  adminController.restrictTo("super-admin", "admin")
);

Router.route("/")
  .get(couponController.getAllCoupons)
  .post(couponController.createCoupon);

Router.route("/:id")
  .all(objectIdErrorHandler)
  .get(couponController.getCoupon)
  .patch(couponController.updateCoupon)
  .delete(couponController.deleteCoupon);

//Export Router ----------------------------------------------->
module.exports = Router;
