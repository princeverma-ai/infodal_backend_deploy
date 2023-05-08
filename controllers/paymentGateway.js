//imports ----------------------------------------------------->
const crypto = require("crypto");
const { razorpayInstance, stripe } = require("../utils/paymentInstance");

const TransactionModel = require("../models/transaction");
const UserModel = require("../models/user");
const CourseModel = require("../models/course");
const CouponModel = require("../models/coupon");
const InCashModel = require("../models/inCash");
const AffiliateCodeModel = require("../models/affiliateCode");

const emailHandler = require("../utils/emailHandler");
const ApiFeatures = require("../utils/apiFeatures");
const { sendErrorMessage } = require("../utils/errorHandler");

const paymentSuccessEventHandler = async (transaction) => {
  try {
    //*UPDATE USER MODEL---------------------------------------->
    const user = await UserModel.findByIdAndUpdate(
      transaction.userId,
      {
        $push: { coursedEnrolled: transaction.courseId },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    //*UPDATE COURSE MODEL---------------------------------------->
    const course = await CourseModel.findByIdAndUpdate(
      transaction.courseId,
      {
        $inc: { totalCourseSold: 1 },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    //*UPDATE INCASH---------------------------------------->
    if (transaction.inCashId) {
      const incash = await InCashModel.findByIdAndUpdate(
        transaction.inCashId,
        {
          $inc: { inCashAmount: -transaction.inCashAmountUsed },
          $push: {
            coursesUsedOn: {
              courseId: course._id,
              amount: transaction.inCashAmountUsed,
            },
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );
      console.log(incash);
    }

    //*UPDATE AFFILIATE CODE--------------------------------->
    if (transaction.affiliateCodeId) {
      const affiliate = await AffiliateCodeModel.findByIdAndUpdate(
        transaction.affiliateCodeId,
        {
          $push: {
            usersUsedBy: {
              userId: user._id,
              courseId: course._id,
            },
          },
          $inc: { timesUsed: 1 },
        },
        {
          new: true,
          runValidators: true,
        }
      );
      console.log(affiliate);
    }

    //*UPDATE COUPON---------------------------------------->
    if (transaction.couponId) {
      const coupon = await CouponModel.findByIdAndUpdate(
        transaction.couponId,
        {
          $inc: { timesUsed: 1 },
          $push: {
            coursesUsedOn: {
              courseId: course._id,
            },
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );
      console.log(coupon);
    }

    //SEND EMAIL TO USER AND ADMIN
    const mailOptions = {
      recipientEmail: user.email,
      subject: `Thanks for Purchasing the Course, ${user.name} !`,
      text: `${user.name},<br><br>Thanks for purchasing the course, ${course.title}.<br><br>Regards,<br>Team Infodal}`,
      html: `${user.name},<br><br>Thanks for purchasing the course, ${course.title}.<br><br>Regards,<br>Team Infodal}`,
    };

    //send email to sender
    const mailOptions2 = {
      recipientEmail: process.env.DOMAIN_EMAIL,
      subject: `New Course Purchase from ${user.name}`,
      text: `${user.name} has bought the course ${course.title} for ${transaction.amount} with refrence id ${transaction.razorpay_payment_id}`,
      html: `${user.name} has bought the course ${course.title} for ${transaction.amount} with refrence id ${transaction.razorpay_payment_id}`,
    };

    await emailHandler.sendEmail(mailOptions);
    await emailHandler.sendEmail(mailOptions2);
  } catch (err) {
    console.log(err);
  }
};

exports.preCheckoutMiddleware = async (req, res, next) => {
  try {
    //check if courseId is present in req body
    if (!req.body.courseId || !req.body.userId) {
      return sendErrorMessage(res, 400, "Invalid Request");
    }

    //check if user exists------------------------------------->
    const user = await UserModel.findById(req.body.userId);
    if (!user) {
      return sendErrorMessage(res, 400, "Invalid User Id");
    }

    //check if course exists------------------------------------>
    const course = await CourseModel.findById(req.body.courseId);
    if (!course) {
      return sendErrorMessage(res, 400, "Invalid Course Id");
    }

    //*CHECKOUT PRICE---------------------------------------->
    let checkoutPrice = course.price;

    //*COUPON CODE CHECK---------------------------------------->
    let coupon = null;
    if (req.body.couponCode) {
      coupon = await CouponModel.findOne({
        couponCode: req.body.couponCode,
      });
      if (!coupon) {
        return sendErrorMessage(res, 400, "Invalid Coupon Code");
      }
      if (
        coupon.expiryDate.getTime() < Date.now() &&
        coupon.startDate.getTime() > Date.now()
      ) {
        return sendErrorMessage(
          res,
          400,
          "Coupon Code has expired or not yet started"
        );
      }

      if (coupon.maxUseTimes <= coupon.timesUsed) {
        return sendErrorMessage(
          res,
          400,
          "Coupon Code has been used maximum times"
        );
      }

      dicountPercent = coupon.discountInPercentage;
      checkoutPrice = checkoutPrice - (checkoutPrice * dicountPercent) / 100;
    }

    //*Affliliate CODE CHECK---------------------------------------->
    let affiliate = null;
    if (req.body.affiliateCode) {
      affiliate = await AffiliateCodeModel.findOne({
        affiliateCode: req.body.affiliateCode,
      });
      if (!affiliate) {
        return sendErrorMessage(res, 400, "Invalid affiliate Code");
      }
      if (
        affiliate.expiryDate.getTime() < Date.now() &&
        affiliate.startDate.getTime() > Date.now()
      ) {
        return sendErrorMessage(
          res,
          400,
          "Affiliate Code has expired or not yet started"
        );
      }
      if (affiliate.maxUseTimes <= affiliate.timesUsed) {
        return sendErrorMessage(
          res,
          400,
          "Affiliate Code has been used maximum times"
        );
      }

      checkoutPrice = checkoutPrice - affiliate.discountAmount;
    }

    //*INCASH---------------------------------------->
    if (req.body.inCashAmount) {
      //get incash from user model
      const incash = await InCashModel.findById(user.inCashId);

      if (!incash) {
        return sendErrorMessage(res, 400, "Invalid InCash Id");
      }

      //check if incash is expired or not
      if (incash.expiryDate.getTime() < Date.now()) {
        return sendErrorMessage(res, 400, "InCash has expired");
      }

      //check if given incash amount is present in our database
      if (
        !req.body.inCashAmount ||
        req.body.inCashAmount > incash.inCashAmount
      ) {
        return sendErrorMessage(res, 400, "Invalid InCash Amount");
      }

      //check if incash amount is greater than 10% of course price
      if (req.body.inCashAmount > (course.price * 10) / 100) {
        return sendErrorMessage(
          res,
          400,
          "InCash amount cannot be greater than 10% of course price"
        );
      }

      //change checkout price
      checkoutPrice = checkoutPrice - req.body.inCashAmount;
    }

    //*FINAL CHECKOUT PRICE---------------------------------------->
    if (checkoutPrice <= 0) {
      return sendErrorMessage(res, 400, "Invalid Checkout Price");
    }

    req.checkoutPrice = checkoutPrice;
    req.checkoutCurrency = process.env.CURRENCY;
    req.course = course;
    req.user = user;
    req.coupon = coupon;
    req.affiliate = affiliate;

    next();
  } catch (error) {
    console.log(error);
    return sendErrorMessage(res, 500, "Internal Server Error");
  }
};

//Exports ---------------------------------------------------->
exports.razorpayCheckout = async (req, res) => {
  try {
    //*ORDER---------------------------------------->
    const priceSmallestUnit = Math.round(
      req.checkoutPrice * process.env.CURRENCY_SMALLEST_UNIT_VALUE
    );
    const options = {
      amount: priceSmallestUnit,
      currency: req.checkoutCurrency,
    };
    const order = await razorpayInstance.orders.create(options);

    //*SAVE TO DATABASE ------------------------------------------>
    await TransactionModel.create({
      courseId: req.course._id,
      userId: req.user._id,
      coursePrice: req.course.price,
      checkoutPrice: req.checkoutPrice,
      transactionCurrency: req.checkoutCurrency,
      razorpay_order_id: order.id,

      couponId: req.coupon ? coupon._id : null,
      couponCode: req.coupon ? req.coupon.couponCode : null,
      couponDiscountInPercentage: req.coupon
        ? req.coupon.discountInPercentage
        : null,

      inCashId: req.body.inCashAmount ? req.user.inCashId : null,
      inCashAmountUsed: req.body.inCashAmount ? req.body.inCashAmount : null,

      affiliateCodeId: req.affiliate ? req.affiliate._id : null,
      affiliateCode: req.affiliate ? req.affiliate.affiliateCode : null,
      affiliateCodeDiscountAmount: req.affiliate
        ? req.affiliate.discountAmount
        : null,
    });

    //*RESPONSE---------------------------------------->
    return res.status(200).json({
      status: "success",
      order,
    });
  } catch (error) {
    console.log(error);
    return sendErrorMessage(res, 500, error.message);
  }
};

//---------------------------------------------------------------->
exports.razorpayPaymentVerification = async (req, res) => {
  try {
    //*VERIFY SIGNATURE ------------------------------------------>
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    //*Success or Failure handling ------------------------------>
    if (expectedSignature === razorpay_signature) {
      //SEND RESPONSE
      res.redirect(
        `${process.env.RAZOPAY_PAYMENT_SUCCESS_PAGE_URL}?reference=${razorpay_payment_id}`
      );

      //*UPDATE TO DATABSE---------------------------------------->
      const transaction = await TransactionModel.findOneAndUpdate(
        { razorpay_order_id: razorpay_order_id },
        {
          razorpay_payment_id: razorpay_payment_id,
          razorpay_signature: razorpay_signature,
          isPaid: true,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      await paymentSuccessEventHandler(transaction);
    } else {
      return sendErrorMessage(res, 400, "Payment Failed Invalid Signature");
    }
  } catch (error) {
    console.log(error);
    return sendErrorMessage(res, 500, error.message);
  }
};

//*STRIPE--------------------------------------------------------->
exports.stripeCheckout = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          // price: "price_1MzCn7SJmmSxg6XjWgCf4bg5",
          price: req.course.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: process.env.STRIPE_PAYMENT_SUCCESS_PAGE_URL,
      cancel_url: process.env.STRIPE_PAYMENT_CANCEL_PAGE_URL,
    });

    res.redirect(303, session.url);

    //*SAVE TO DATABASE ------------------------------------------>
    await TransactionModel.create({
      courseId: req.course._id,
      userId: req.user._id,
      coursePrice: req.course.price,
      checkoutPrice: req.checkoutPrice,
      transactionCurrency: req.checkoutCurrency,

      stripe_checkout_id: session.id,

      couponId: req.coupon ? coupon._id : null,
      couponCode: req.coupon ? req.coupon.couponCode : null,
      couponDiscountInPercentage: req.coupon
        ? req.coupon.discountInPercentage
        : null,

      inCashId: req.body.inCashAmount ? req.user.inCashId : null,
      inCashAmountUsed: req.body.inCashAmount ? req.body.inCashAmount : null,

      affiliateCodeId: req.affiliate ? req.affiliate._id : null,
      affiliateCode: req.affiliate ? req.affiliate.affiliateCode : null,
      affiliateCodeDiscountAmount: req.affiliate
        ? req.affiliate.discountAmount
        : null,
    });
  } catch (error) {
    console.log(error);
    return sendErrorMessage(res, 500, error.message);
  }
};

exports.stripeWebhook = async (req, res) => {
  console.log("Web hook is called ");
  const sig = req.headers["stripe-signature"];

  let event;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.log(err);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  //event.type
  //req.body.type
  switch (event.type) {
    case "checkout.session.completed":
      const paymentIntent = req.body.data.object.payment_intent;
      const transaction = await TransactionModel.findOneAndUpdate(
        { stripe_checkout_id: req.body.data.object.id },
        {
          isPaid: true,
          stripe_paymentIntent: paymentIntent,
        },
        {
          new: true,
          runValidators: true,
        }
      );
      console.log(transaction);
      await paymentSuccessEventHandler(transaction);
      break;
    default:
      console.log(`Unhandled event type ${req.body.type}`);
  }

  // Return a 200 res to acknowledge receipt of the event
  return res.status(200).send("ok");
};

//---------------------------------------------------------------->
exports.getAllTransactions = async (req, res) => {
  try {
    //INITIALIZE QUERY
    const features = new ApiFeatures(TransactionModel.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalDocuments = await TransactionModel.countDocuments();

    //EXECUTE QUERY
    const transactions = await features.query;

    //Error Handling
    if (transactions.length === 0) {
      return sendErrorMessage(res, 404, "No transactions found");
    }

    //SEND RESPONSE
    return res.status(200).json({
      status: "success",
      results: transactions.length,
      page: req.query.page * 1,
      totalDocuments,
      data: {
        transactions,
      },
    });
  } catch (error) {
    return sendErrorMessage(res, 500, error.message);
  }
};

//---------------------------------------------------------------->
exports.getTransaction = async (req, res) => {
  try {
    //GET TRANSACTION
    const transaction = await TransactionModel.findById(req.params.id);

    if (!transaction) {
      return sendErrorMessage(res, 404, "No transaction found");
    }

    //SEND RESPONSE
    return res.status(200).json({
      status: "success",
      data: {
        transaction,
      },
    });
  } catch (error) {
    return sendErrorMessage(res, 500, error.message);
  }
};

//---------------------------------------------------------------->
exports.updateTransaction = async (req, res) => {
  try {
    //GET TRANSACTION
    const transaction = await TransactionModel.findByIdAndUpdate(
      req.params.id,
      { comment: req.body.comment },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!transaction) {
      return sendErrorMessage(res, 404, "No transaction found");
    }

    //SEND RESPONSE
    return res.status(200).json({
      status: "success",
      data: {
        transaction,
      },
    });
  } catch (error) {
    return sendErrorMessage(res, 500, error.message);
  }
};
