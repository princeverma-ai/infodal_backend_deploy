const Course = require("./../models/course");
const { sendErrorMessage } = require("../utils/errorHandler");

// Runs every day at midnight
exports.discountCronJob = async (req, res) => {
  try {
    const courses = await Course.find();
    let updateCount = 0;
    courses.forEach(async (course) => {
      if (
        course.discountEndDate &&
        course.discountEndDate.getTime() <= Date.now()
      ) {
        const oldPrice = course.price;
        const newPrice = oldPrice + course.discountInPrice;
        course.price = newPrice;
        course.discountInPrice = null;
        course.discountStartDate = null;
        course.discountEndDate = null;
        await course.save();
        updateCount++;
      }
      if (
        course.discountStartDate &&
        course.discountStartDate.getTime() >= Date.now()
      ) {
        const oldPrice = course.price;
        const newPrice = oldPrice - course.discountInPrice;
        course.price = newPrice;
        course.discountInPrice = null;
        course.discountStartDate = null;
        course.discountEndDate = null;
        await course.save();
        updateCount++;
      }
    });
    console.log(`Found ${updateCount} courses to update in CRON job`);
    res.status(200).json({
      status: "success",
      data: {
        updatedCoursesCount: updateCount,
      },
    });
  } catch (err) {
    console.log(err);
    return sendErrorMessage(res, 400, err.message);
  }
};
