//imports ----------------------------------------------------->
const mongoose = require("mongoose");

//Schema ------------------------------------------------------>
const ExchangeRateSchema = new mongoose.Schema(
  {
    exchangeData: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

// model -------------------------------------------------->
const ExchangeRate = mongoose.model("ExchangeRate", ExchangeRateSchema);

//Export model ------------------------------------------->
module.exports = ExchangeRate;
