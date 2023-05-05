//imports ----------------------------------------------------->
const mongoose = require("mongoose");

//Schema ------------------------------------------------------>
const ReviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: [true, "Please enter rating"],
      min: 0,
      max: 5,
    },
    description: {
      type: String,
      required: [true, "Please enter description"],
      trim: true,
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    courseId: {
      type: mongoose.Schema.ObjectId,
      ref: "Course",
      required: [true, "Please enter course id"],
    },
    approved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// model -------------------------------------------------->
const Review = mongoose.model("Review", ReviewSchema);

//Export model ------------------------------------------->
module.exports = Review;
