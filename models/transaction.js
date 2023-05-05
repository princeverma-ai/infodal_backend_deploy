//imports ----------------------------------------------------->
const mongoose = require("mongoose");

//Schema ------------------------------------------------------>
const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Please enter user id"],
    },
    courseId: {
      type: mongoose.Schema.ObjectId,
      ref: "Course",
      required: [true, "Please enter course id"],
    },
    coursePrice: {
      type: Number,
      required: [true, "Please enter course price"],
    },
    checkoutPrice: {
      type: Number,
      required: [true, "Please enter checkout price"],
    },
    transactionCurrency: {
      type: String,
      required: [true, "Please enter transaction currency"],
    },
    stripe_checkout_id: {
      type: String,
    },
    stripe_paymentIntent: {
      type: String,
    },
    razorpay_order_id: {
      type: String,
    },
    razorpay_payment_id: {
      type: String,
    },
    razorpay_signature: {
      type: String,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    couponId: {
      type: mongoose.Schema.ObjectId,
      ref: "Coupon",
    },
    couponCode: {
      type: String,
    },
    couponDiscountInPercentage: {
      type: Number,
    },
    inCashId: {
      type: mongoose.Schema.ObjectId,
      ref: "InCash",
    },
    inCashAmountUsed: {
      type: Number,
    },
    affiliateCodeId: {
      type: mongoose.Schema.ObjectId,
      ref: "AffiliateCode",
    },
    affiliateCode: {
      type: String,
    },
    affiliateCodeDiscountAmount: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// model -------------------------------------------------->
const Transaction = mongoose.model("Transaction", TransactionSchema);

//Export model ------------------------------------------->
module.exports = Transaction;
