//imports ----------------------------------------------------->
const mongoose = require("mongoose");

//Schema ------------------------------------------------------>
const AffiliateCodeSchema = new mongoose.Schema(
  {
    affiliateCode: {
      type: String,
      unique: true,
      required: [true, "Please enter affiliate code"],
      trim: true,
    },
    usersUsedBy: [
      {
        courseId: {
          type: mongoose.Schema.ObjectId,
          ref: "Course",
        },
        userId: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
      },
    ],
    discountAmount: {
      type: Number,
      required: [true, "Please enter discount Amount"],
    },
    maxUseTimes: {
      type: Number,
      required: [true, "Please enter max use times"],
    },
    timesUsed: {
      type: Number,
      default: 0,
    },
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
const AffiliateCode = mongoose.model("AffiliateCode", AffiliateCodeSchema);

//Export model ------------------------------------------->
module.exports = AffiliateCode;
