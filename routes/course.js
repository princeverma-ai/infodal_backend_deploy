//imports ----------------------------------------------------->
const express = require("express");
const courseController = require("../controllers/course");
const adminController = require("../controllers/admin");
const courseSearchController = require("../controllers/courseSearch");
const {
  singleImageMiddleware,
  imageUploadErrorHandler,
} = require("../utils/uploadMulter");
const { objectIdErrorHandler } = require("../utils/errorHandler");

//Router ------------------------------------------------------>
const Router = express.Router();

Router.route("/")
  .get(courseController.getAllCourses)
  .post(
    adminController.protect,
    adminController.restrictTo("super-admin", "admin", "manager"),
    singleImageMiddleware,
    imageUploadErrorHandler,
    courseController.createCourse
  );

Router.route("/search").get(courseSearchController.courseSearch);

Router.route("/bulk").patch(
  adminController.protect,
  adminController.restrictTo("super-admin", "admin"),
  courseController.bulkUpdateCourses
);

Router.route("/:id")
  .all(objectIdErrorHandler)
  .get(courseController.getCourse)
  .patch(
    adminController.protect,
    adminController.restrictTo("super-admin", "admin", "manager"),
    singleImageMiddleware,
    imageUploadErrorHandler,
    courseController.updateCourse
  )
  .delete(
    adminController.protect,
    adminController.restrictTo("super-admin", "admin", "manager"),
    courseController.deleteCourse
  );

Router.route("/:id/review")
  .all(objectIdErrorHandler)
  .get(courseController.getCourseReviews);

//Export Router ----------------------------------------------->
module.exports = Router;
