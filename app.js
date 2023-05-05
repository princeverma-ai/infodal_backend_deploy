//imports ----------------------------------------------------->
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

//routes imports ---------------------------------------------->
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const userRouter = require("./routes/user");
const courseRouter = require("./routes/course");
const reviewRouter = require("./routes/review");
const webFormRouter = require("./routes/webForm");
const paymentGatewayRouter = require("./routes/paymentGateway");
const manualTransactionRouter = require("./routes/manualTransaction");
const couponRouter = require("./routes/coupon");
const affiliateCodeRouter = require("./routes/affiliateCode");
const contentRouter = require("./routes/content");

const statRouter = require("./routes/stat");

const discountCronJob = require("./jobs/discountCronJob");

//initialize app ---------------------------------------------->
const app = express();

//*MIDDLEWARES -------------------------------------------------->

//cors
app.use(
  cors({
    origin: "*",
  })
);

//rate limiter
const limiter = rateLimit({
  max: process.env.MAX_REQUESTS_PER_HOUR || 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use(limiter);

//set security HTTP headers
app.use(helmet());

//body parser, reading data from body into req.body
app.use(
  express.json({
    limit: "10kb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(express.urlencoded({ extended: true }));

//data sanitization against NoSQL query injection
app.use(mongoSanitize());

//data sanitization against XSS
app.use(xss());

//*ROUTES ------------------------------------------------------>
app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/user", userRouter);
app.use("/course", courseRouter);
app.use("/review", reviewRouter);
app.use("/webForm", webFormRouter);
app.use("/paymentGateway", paymentGatewayRouter);
app.use("/manualTransaction", manualTransactionRouter);
app.use("/coupon", couponRouter);
app.use("/affiliateCode", affiliateCodeRouter);

app.use("/content", contentRouter);

app.use("/stat", statRouter);

//*JOBS ------------------------------------------------------>
app.get("/discountCronJob", discountCronJob.discountCronJob);

//Error handling ---------------------------------------------->
app.all("*", (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

//Export app -------------------------------------------------->
module.exports = app;
