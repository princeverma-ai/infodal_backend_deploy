//imports ----------------------------------------------------->
const mongoose = require("mongoose");

//Schema ------------------------------------------------------>
const ContentSchema = new mongoose.Schema(
  {
    courseCategories: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

// model -------------------------------------------------->
const Content = mongoose.model("Content", ContentSchema);

//Export model ------------------------------------------->
module.exports = Content;
