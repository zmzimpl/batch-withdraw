// utils.js

const axios = require("axios");
const crypto = require("crypto");
const config = require("../config");

function signature(timestamp, method, requestPath, body, secretKey) {
  const message = timestamp + method + requestPath + body;
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(message);
  const output = hmac.digest("base64");
  return output;
}

// A general function to generate a random number between min and max with fixed decimal places
function getRandomNumber(min, max, fixed) {
  const rand = Math.random() * (max - min) + min;
  const power = Math.pow(10, fixed);
  return (Math.floor(rand * power) / power).toFixed(fixed);
}

// A general function to get supported chains for a given currency
async function getSupportedChains(ccy) {
  const headers = {
    "Content-Type": "application/json",
    "OK-ACCESS-KEY": config.apiKey,
    "OK-ACCESS-PASSPHRASE": config.passphrase,
  };

  const timestamp = Date.now() / 1000;
  const method = "GET";
  const requestPath = `/api/v5/asset/currencies?ccy=${ccy}`;
  headers["OK-ACCESS-TIMESTAMP"] = timestamp.toString();
  headers["OK-ACCESS-SIGN"] = signature(
    timestamp.toString(),
    method,
    requestPath,
    "",
    config.secretKey
  );

  const response = await axios.get(config.endpoint + requestPath, {
    headers,
  });

  if (response.data.msg && response.data.msg.length > 0) {
    throw new Error(`Error : ${response.data.msg}`);
  }

  const chains = response.data.data.map(item => item.chain);
  return chains;
}

module.exports = {
  getRandomNumber,
  getSupportedChains
};
