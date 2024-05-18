// Require necessary libraries
const axios = require("axios");
const crypto = require("crypto");
const config = require("./config");
const wallets = require("./wallets.json");

const {
  minWithdrawal,
  maxWithdrawal,
  fee,
  ccy,
  endpoint,
} = require("./config");

function signature(timestamp, method, requestPath, body, secretKey) {
  const message = timestamp + method + requestPath + body;
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(message);
  const output = hmac.digest("base64");
  return output;
}

function getRandomNumber(min, max, fixed) {
  const rand = Math.random() * (max - min) + min;
  const power = Math.pow(10, fixed);
  return (Math.floor(rand * power) / power).toFixed(fixed);
}

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

  const response = await axios.get(endpoint + requestPath, {
    headers,
  });

  if (response.data.msg && response.data.msg.length > 0) {
    throw new Error(`Error : ${response.data.msg}`);
  }

  const chains = response.data.data.map(item => item.chain);
  chains.forEach((chain, index) => {
    console.log(`${index + 1}. ${chain}`);
  });

  return chains;
}

async function withdrawToAllAddresses(chain) {
  for (const wallet of wallets) {
    const headers = {
      "Content-Type": "application/json",
      "OK-ACCESS-KEY": config.apiKey,
      "OK-ACCESS-PASSPHRASE": config.passphrase,
    };

    const withdrawalParams = {
      amt: getRandomNumber(minWithdrawal, maxWithdrawal, 4),
      fee: fee,
      dest: "4",
      ccy: ccy,
      chain: chain,
      toAddr: wallet.address,
    };

    try {
      const timestamp = Date.now() / 1000;
      const method = "POST";
      const requestPath = "/api/v5/asset/withdrawal";
      const body = JSON.stringify(withdrawalParams);
      headers["OK-ACCESS-TIMESTAMP"] = timestamp.toString();
      headers["OK-ACCESS-SIGN"] = signature(
        timestamp.toString(),
        method,
        requestPath,
        body,
        config.secretKey
      );

      const response = await axios.post(endpoint + requestPath, withdrawalParams, {
        headers,
      });

      if (response.data.msg && response.data.msg.length > 0) {
        throw new Error(`Error : ${response.data.msg}`);
      }

      console.log("\x1b[32m%s\x1b[0m", `Withdrawal successful!`);
      console.log(
        `Withdrawn ${withdrawalParams.amt} ${withdrawalParams.ccy} to ${withdrawalParams.toAddr} on chain ${withdrawalParams.chain}`
      );
      const wdId = response.data.data[0].wdId;
      console.log(`OKX transaction ID: ${response.data.data[0].wdId}`);
      const delay = getRandomNumber(10, 50, 6) * 1000;
      console.log(
        "\x1b[33m%s\x1b[0m",
        `Delaying next withdrawal for ${delay / 1000} seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      console.log("");
    } catch (error) {
      console.log("\x1b[31m%s\x1b[0m", `Withdrawal failed:`, error.message);
      console.log(
        "\x1b[31m%s\x1b[0m",
        `Withdrawal failed: ${withdrawalParams.amt} ${withdrawalParams.ccy} to ${withdrawalParams.toAddr} on chain ${withdrawalParams.chain}`,
        error
      );
    }
  }
}

// Start of the program
async function start() {
  const chains = await getSupportedChains(ccy);
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Please select a chain by entering its number: ', (number) => {
    const chain = chains[number - 1];
    console.log(`You selected ${chain}`);
    withdrawToAllAddresses(chain);
    readline.close();
  });
}

start();
