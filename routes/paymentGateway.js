//imports ----------------------------------------------------->
const paymentGatewayController = require("../controllers/paymentGateway");
const adminController = require("../controllers/admin");
const { objectIdErrorHandler } = require("../utils/errorHandler");

const express = require("express");

//Router ------------------------------------------------------>
const Router = express.Router();

//*RAZORPAY ------------------------------------------------------>
Router.route("/razorpay/checkout").post(
  paymentGatewayController.preCheckoutMiddleware,
  paymentGatewayController.razorpayCheckout
);

//MUST BE A POST REQUEST HERE
Router.route("/razorpay/paymentVerification").post(
  paymentGatewayController.razorpayPaymentVerification
);

//*STRIPE ------------------------------------------------------>
Router.route("/stripe/checkout").post(
  paymentGatewayController.preCheckoutMiddleware,
  paymentGatewayController.stripeCheckout
);
Router.route("/stripe/webhook").post(paymentGatewayController.stripeWebhook);

//*TRANSACTION ------------------------------------------------------>
Router.use(adminController.protect, adminController.restrictTo("super-admin"));

Router.route("/transaction").get(paymentGatewayController.getAllTransactions);
Router.route("/transaction/:id")
  .all(objectIdErrorHandler)
  .get(paymentGatewayController.getTransaction)
  .patch(paymentGatewayController.updateTransaction);

//Export Router ----------------------------------------------->
module.exports = Router;
