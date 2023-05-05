//imports ----------------------------------------------------->
const express = require("express");
const statController = require("../controllers/stat");
const adminController = require("../controllers/admin");

//Router ------------------------------------------------------>
const Router = express.Router();

Router.use(
  adminController.protect,
  adminController.restrictTo("super-admin", "admin")
);

Router.route("/").get(statController.getAllStats);

//Export Router ----------------------------------------------->
module.exports = Router;
