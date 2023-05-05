//Config ---------------------------------------------->
const dotenv = require("dotenv");

//config  settings------------------------------------------->
dotenv.config({ path: "./config.env" });

//imports ---------------------------------------------->
const mongoose = require("mongoose");
const app = require("./app");

process.on("uncaughtException", (err) => {
  console.error("Unhandled Exception:", err);
  // Do any cleanup and exit the process
  process.exit(1);
});

const db_uri =
  process.env.NODE_ENV == "production"
    ? process.env.DB_URL_CLOUD
    : process.env.DB_URL_LOCAL;

//database -------------------------------------------->
mongoose
  .connect(db_uri, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Database connected successfully");

    //server ---------------------------------------------->
    const port = process.env.PORT || 8000;
    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });

// Global error handler for unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  // Do any cleanup and exit the process
  process.exit(1);
});
