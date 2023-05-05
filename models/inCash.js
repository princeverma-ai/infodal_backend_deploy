//imports ----------------------------------------------------->
const mongoose = require("mongoose");

//Schema ------------------------------------------------------>
const InCashSchema = new mongoose.Schema(
  {
    inCashAmount: {
      type: Number,
      required: [true, "Please enter inCash amount"],
    },
    coursesUsedOn: [
      {
        courseId: {
          type: mongoose.Schema.ObjectId,
          ref: "Course",
        },
        amount: {
          type: Number,
        },
      },
    ],

    expiryDate: {
      type: Date,
      required: [true, "Please enter expiry date"],
    },
    startDate: {
      type: Date,
      required: [true, "Please enter inCash start date"],
    },
  },
  {
    timestamps: true,
  }
);

// model -------------------------------------------------->
const InCash = mongoose.model("InCash", InCashSchema);

//Export model ------------------------------------------->
module.exports = InCash;
