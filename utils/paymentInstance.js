//imports ----------------------------------------------------->
const Razorpay = require("razorpay");

//*Razorpay ---------------------------------------------------->
exports.razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

//*STRIPE ---------------------------------------------------->
exports.stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
