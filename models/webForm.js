//imports ----------------------------------------------------->
const mongoose = require("mongoose");

//Schema ------------------------------------------------------>
const WebFormSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please enter email"],
      trim: true,
      match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Please enter phone number"],
      trim: true,
    },
    formType: {
      type: String,
      enum: [
        "requestServer",
        "bookDemo",
        "requestCourse",
        "inquiry",
        "contactUs",
        "becomeInstructor",
      ],
      required: [true, "Please enter valid form type"],
    },
    //BOOK DEMO---------------------------------------------->
    bookDemoCourse: {
      type: String,
      trim: true,
    },
    //INQUIRY------------------------------------------------->
    inquiryDescription: {
      type: String,
      trim: true,
    },
    //REQUEST COURSE------------------------------------------->
    requestCourseTopic: {
      type: String,
      trim: true,
    },
    //CONTACT US---------------------------------------------->
    contactUsTopic: {
      type: String,
      trim: true,
    },
    //REQUEST SERVER------------------------------------------>
    requestServerCloudServer: {
      type: String,
      trim: true,
    },
    //*DURATION IS IN HOURS
    requestServerDuration: {
      type: String,
      trim: true,
    },
    //BECOME INSTRUCTOR---------------------------------------->
    becomeInstructorCountry: {
      type: String,
      trim: true,
    },
    becomeInstructorLinkedin: {
      type: String,
      trim: true,
    },
    becomeInstructorDescription: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// model -------------------------------------------------->
const WebForm = mongoose.model("WebForm", WebFormSchema);

//Export model ------------------------------------------->
module.exports = WebForm;
