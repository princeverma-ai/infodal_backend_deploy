//imports ----------------------------------------------------->
const adminController = require("../controllers/admin");
const { objectIdErrorHandler } = require("../utils/errorHandler");
const manualTransactionController = require("../controllers/manualTransaction");

const express = require("express");

//Router ------------------------------------------------------>
const Router = express.Router();

Router.use(adminController.protect, adminController.restrictTo("super-admin"));

Router.route("/")
  .get(manualTransactionController.getAllTransactions)
  .post(manualTransactionController.createTransaction);

Router.route("/:id")
  .all(objectIdErrorHandler)
  .get(manualTransactionController.getTransaction)
  .patch(manualTransactionController.updateTransaction)
  .delete(manualTransactionController.deleteTransaction);

//Export Router ----------------------------------------------->
module.exports = Router;
