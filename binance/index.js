const { Spot } = require("@binance/connector");
const config = require("./config");
const wallets = require("./wallets.json");
const readline = require("readline");
const client = new Spot(config.apiKey, config.secretKey);

function getRandomNumber(min, max, fixed) {
  const rand = Math.random() * (max - min) + min;
  const power = Math.pow(10, fixed);
  return (Math.floor(rand * power) / power).toFixed(fixed);
}

async function getCoinNetworks(coin) {
  try {
    const response = await client.coinInfo();
    if (response.status === 200 && response.data) {
      const coinInfo = response.data.find((asset) => asset.coin === coin);
      if (!coinInfo || coinInfo.networkList.length === 0) {
        console.log(`No networks found for ${coin}`);
        return [];
      }
      console.log(`Supported networks for ${coin}:`);
      coinInfo.networkList
        .filter((item) => item.withdrawEnable)
        .forEach((network, index) => {
          console.log(`${index + 1}. Network: ${network.network}`);
        });
      return coinInfo.networkList;
    } else {
      throw new Error("Failed to fetch coin networks");
    }
  } catch (error) {
    console.log(error);
    console.error(`Error fetching networks for ${coin}:`, error.message);
    return [];
  }
}

async function withdrawToAllAddresses(
  ccy,
  network,
  maxRetries = 3,
  retryDelay = 5000
) {
  for (const wallet of wallets) {
    console.log(wallet);
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const amount = getRandomNumber(
          config.minWithdrawal,
          config.maxWithdrawal,
          getRandomNumber(3, 5, 0)
        );
        console.log(
          `Withdrawing ${amount} ${config.ccy} to ${wallet.address}, network: ${network}`
        );
        const response = await client.withdraw(
          config.ccy,
          wallet.address,
          amount,
          {
            network: network,
          }
        );
        if (response.status === 200) {
          console.log(
            `Withdrawal successful: ${amount} ${ccy} to ${wallet.address}`
          );
          break;
        } else {
          throw new Error(`Error: ${response.data.msg}`);
        }
      } catch (error) {
        console.log(error);
        console.error(
          `Withdrawal failed: ${error}, Retrying...`,
          error.message
        );
        retries++;
        if (retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }
  }
}

async function start() {
  const coin = config.ccy; // 从配置文件读取币种
  const networks = await getCoinNetworks(coin);
  if (networks.length > 0) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      "Please select a network by entering its number: ",
      async (number) => {
        const index = parseInt(number) - 1;
        if (index >= 0 && index < networks.length) {
          await withdrawToAllAddresses(coin, networks[index].network);
        } else {
          console.log("Invalid selection. Exiting.");
        }
        rl.close();
      }
    );
  }
}

start();
