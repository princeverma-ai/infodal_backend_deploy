//imports ----------------------------------------------------->
const mongoose = require("mongoose");

//Schema ------------------------------------------------------>
const manualTransactionSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, "Please enter user name"],
    },
    userEmail: {
      type: String,
      required: [true, "Please enter user email"],
    },
    userPhoneNumber: {
      type: String,
      required: [true, "Please enter user phone number"],
    },
    courseName: {
      type: String,
      required: [true, "Please enter course name"],
    },
    paymentGateway: {
      type: String,
      required: [true, "Please enter payment gateway"],
    },
    transactionId: {
      type: String,
      required: [true, "Please enter transaction id"],
    },
    transactionRemarks: {
      type: String,
    },
    transactionCurrency: {
      type: String,
      required: [true, "Please enter transaction currency"],
    },
    transactionAmount: {
      type: Number,
      required: [true, "Please enter transaction amount"],
    },
    transactionDate: {
      type: Date,
      required: [true, "Please enter transaction date"],
    },
    comment: {
      type: String,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    couponCode: {
      type: String,
    },
    couponDiscount: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// model -------------------------------------------------->
const ManualTransaction = mongoose.model(
  "ManualTransaction",
  manualTransactionSchema
);

//Export model ------------------------------------------->
module.exports = ManualTransaction;
