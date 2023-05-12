//imports ----------------------------------------------------->
const { sendErrorMessage } = require("../utils/errorHandler");
const User = require("../models/user");
const ManualTransaction = require("../models/manualTransaction");
const Transaction = require("../models/transaction");
const Course = require("../models/course");
const Admin = require("../models/admin");
const WebForm = require("../models/webForm");
const Coupon = require("../models/coupon");
const AffiliateCode = require("../models/affiliateCode");

const moment = require("moment");
const startOfWeek = moment().startOf("week");
const startOfMonth = moment().startOf("month");

exports.getAllStats = async (req, res) => {
  try {
    const userWeeklyPipeline = [
      // Group by week and count number of documents
      {
        $group: {
          _id: {
            week: { $week: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      // Filter out older weeks
      {
        $match: {
          "_id.year": moment().year(),
          "_id.week": { $gte: startOfWeek.week() },
        },
      },
      // Project to show only week and count fields
      {
        $project: {
          _id: 0,
          week: "$_id.week",
          count: 1,
        },
      },
    ];
    const instructorWeeklyPipeline = [
      // Filter by formType
      {
        $match: {
          formType: "becomeInstructor",
        },
      },
      // Group by week and count number of documents
      {
        $group: {
          _id: {
            week: { $week: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      // Filter out older weeks
      {
        $match: {
          "_id.year": moment().year(),
          "_id.week": { $gte: startOfWeek.week() },
        },
      },
      // Project to show only week and count fields
      {
        $project: {
          _id: 0,
          week: "$_id.week",
          count: 1,
        },
      },
    ];

    const weeklyUserStats = await User.aggregate(userWeeklyPipeline);
    const weeklyInstructorStats = await WebForm.aggregate(
      instructorWeeklyPipeline
    );

    // Similar pipeline for monthly stats
    const userMonthlyPipeline = [
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          "_id.year": moment().year(),
          "_id.month": { $gte: startOfMonth.month() + 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          count: 1,
        },
      },
    ];

    // Similar pipeline for monthly stats, with added filtering by formType
    const instructorMonthlyPipeline = [
      // Filter by formType
      {
        $match: {
          formType: "becomeInstructor",
        },
      },
      // Group by month and count number of documents
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      // Filter out older months
      {
        $match: {
          "_id.year": moment().year(),
          "_id.month": { $gte: startOfMonth.month() + 1 },
        },
      },
      // Project to show only month and count fields
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          count: 1,
        },
      },
    ];

    const monthlyUserStats = await User.aggregate(userMonthlyPipeline);
    const monthlyInstructorStats = await WebForm.aggregate(
      instructorMonthlyPipeline
    );

    const stats = await Promise.all([
      User.countDocuments({ active: true }),
      ManualTransaction.countDocuments(),
      Transaction.countDocuments(),
      Coupon.countDocuments(),
      AffiliateCode.countDocuments(),
      Course.countDocuments(),
      Admin.countDocuments(),
      WebForm.countDocuments({ formType: "becomeInstructor" }),
    ]);

    const [
      numUsers,
      numManualTransactions,
      numTransactions,
      numCoupons,
      numAffiliates,
      numCourses,
      numAdmins,
      numBecomeInstructorForms,
    ] = stats;

    return res.status(200).json({
      numUsers,
      numManualTransactions,
      numTransactions,
      numCoupons,
      numAffiliates,
      numCourses,
      numAdmins,
      numBecomeInstructorForms,
      weeklyUserStats,
      monthlyUserStats,
      weeklyInstructorStats,
      monthlyInstructorStats,
    });
  } catch (error) {
    return sendErrorMessage(res, 400, error.message, true);
  }
};
