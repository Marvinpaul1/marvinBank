const axios = require("axios");

let cathedToken = null;
let tokenExpire = null;

const getNibssToken = async () => {
  if (cathedToken && tokenExpire && Date.now() < tokenExpire) {
    return cathedToken;
  }
  const response = await axios.post(
    "https://nibssbyphoenix.onrender.com/api/auth/token",
    {
      apiKey: process.env.NIBSS_API_KEY,
      apiSecret: process.env.NIBSS_SECRET_KEY,
    },
  );
  cathedToken = response.data.token;
  tokenExpire = Date.now() + 60 * 60 * 1000;

  return cathedToken;
};

module.exports = getNibssToken;
