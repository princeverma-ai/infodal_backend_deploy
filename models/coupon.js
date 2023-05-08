//imports ----------------------------------------------------->
const mongoose = require("mongoose");

//Schema ------------------------------------------------------>
const CouponSchema = new mongoose.Schema(
  {
    couponCode: {
      type: String,
      unique: true,
      required: [true, "Please enter coupon code"],
      trim: true,
    },
    discountInPercentage: {
      type: Number,
      required: [true, "Please enter discount in percentage"],
    },
    maxUseTimes: {
      type: Number,
      required: [true, "Please enter max use times"],
    },
    timesUsed: {
      type: Number,
      default: 0,
    },
    coursesUsedOn: [
      {
        courseId: {
          type: mongoose.Schema.ObjectId,
          ref: "Course",
        },
      },
    ],
    expiryDate: {
      type: Date,
      required: [true, "Please enter expiry date"],
    },
    startDate: {
      type: Date,
      required: [true, "Please enter coupon start date"],
    },
  },
  {
    timestamps: true,
  }
);

// model -------------------------------------------------->
const Coupon = mongoose.model("Coupon", CouponSchema);

//Export model ------------------------------------------->
module.exports = Coupon;
