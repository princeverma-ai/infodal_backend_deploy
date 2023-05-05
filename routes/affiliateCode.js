//imports ----------------------------------------------------->
const express = require("express");
const affiliateCodeController = require("../controllers/affiliateCode");
const adminController = require("../controllers/admin");
const { objectIdErrorHandler } = require("../utils/errorHandler");

//Router ------------------------------------------------------>
const Router = express.Router();

Router.use(
  adminController.protect,
  adminController.restrictTo("super-admin", "admin")
);

Router.route("/")
  .get(affiliateCodeController.getAllAffiliateCodes)
  .post(affiliateCodeController.createAffiliateCode);

Router.route("/:id")
  .all(objectIdErrorHandler)
  .get(affiliateCodeController.getAffiliateCode)
  .patch(affiliateCodeController.updateAffiliateCode)
  .delete(affiliateCodeController.deleteAffiliateCode);

//Export Router ----------------------------------------------->
module.exports = Router;
