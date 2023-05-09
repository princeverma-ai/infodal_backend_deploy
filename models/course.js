//imports ----------------------------------------------------->
const mongoose = require("mongoose");

//Schema ------------------------------------------------------>
const CourseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter course name"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please enter course description"],
      trim: true,
    },
    courseOverview: {
      type: String,
      required: [true, "Please enter course overview"],
      trim: true,
    },
    careerPath: {
      type: String,
      required: [true, "Please enter career path"],
    },
    coursePrerequisites: {
      type: String,
      required: [true, "Please enter course prerequisites"],
      trim: true,
    },
    imageObject: {
      type: Object,
      required: [true, "Please enter course image object"],
      default: {
        imageId: null,
        imageUrl: null,
      },
    },
    //enum - livePlacementCourse , certificationCourse
    courseType: {
      type: String,
      required: [true, "Please enter course type"],
      trim: true,
      enum: [
        "livePlacementCourse",
        "certificationCourse",
        "trainingAndPlacement",
      ],
    },
    courseCategory: {
      type: String,
      required: [true, "Please enter course category"],
      trim: true,
    },
    //Rating is dynamic according to user reviews, float value 0-5
    rating: {
      type: Number,
      required: [true, "Please enter course rating"],
      min: 0,
      max: 5,
      default: 0,
    },
    //format hours
    courseDuration: {
      type: Number,
      required: [true, "Please enter course duration"],
    },
    //enum months days hours
    courseFormat: {
      type: String,
      required: [true, "Please enter course format"],
      trim: true,
      enum: ["months", "days", "hours"],
    },
    totalCourseSold: {
      type: Number,
      required: [true, "Please enter total course sold number"],
    },
    //format number
    discountInPrice: {
      type: Number,
    },
    discountStartDate: {
      type: Date,
    },
    discountEndDate: {
      type: Date,
    },
    //Price
    price: {
      type: Number,
      required: [true, "Please enter course price"],
      min: [0, "Price cannot be negative"],
    },
    stripeProductId: {
      type: String,
    },
    stripePriceId: {
      type: String,
    },
    averagePackage: {
      type: Number,
      required: [true, "Please enter course average package"],
    },
    isTrending: {
      type: Boolean,
      required: [true, "Please enter if course is trending or not"],
    },
    isBestseller: {
      type: Boolean,
      required: [true, "Please enter if course is best seller or not"],
    },
    isPublished: {
      type: Boolean,
      required: [true, "Please enter if course is published or not"],
    },
    isCertificationProvided: {
      type: Boolean,
      required: [
        true,
        "Please enter if course certification is provided or not",
      ],
    },
    GDriveLink: {
      type: String,
    },
    syllabusLink: {
      type: String,
      required: [true, "Please enter course GDrive link"],
    },
    keywords: {
      type: [String],
      required: [true, "Please enter course keywords"],
    },
    slug: {
      type: String,
      trim: true,
    },
    faq: {
      type: [
        {
          question: {
            type: String,
          },
          answer: {
            type: String,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// model -------------------------------------------------->
const Course = mongoose.model("Course", CourseSchema);

//Export model ------------------------------------------->
module.exports = Course;
