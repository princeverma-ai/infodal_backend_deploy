//imports ----------------------------------------------------->
const axios = require("axios");

//Exchange Rates API ------------------------------------------->
const url = `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/${process.env.CURRENCY}`;

exports.getExchangeRates = async () => {
  try {
    const data = await axios.get(url);
    return data.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
