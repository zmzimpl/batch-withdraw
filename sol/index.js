const web3 = require("@solana/web3.js");
const bs58 = require("bs58");

// 发送方钱包私钥
const privateKey = "";
const customRpcUrl = "";

// 接收方地址，不同批次地址会并发执行，同一批次地址会排队执行
const transfers = [
  // 第一批提现地址
  {
    batchName: "batch-1",
    addresses: [
      "4tsWaMTU1eau1NuYiSiHSvfceZ75E4s9d7s7gk71rifJ",
      "ESmAhszCykqpnayBCHnZkWre9zTWTejLZeJLsQZZiiGb",
    ],
  },
  // 第二批提现地址
  {
    batchName: "batch-2",
    addresses: [
      "4tsWaMTU1eau1NuYiSiHSvfceZ75E4s9d7s7gk71rifJ",
      "ESmAhszCykqpnayBCHnZkWre9zTWTejLZeJLsQZZiiGb",
    ],
  },
];
const maxRetries = 100; // 设置最大重试次数
const timeoutMs = 60000; // 超时时间（毫秒）

const decodedPrivateKey = bs58.decode(privateKey);

const senderSecretKey = new Uint8Array(decodedPrivateKey);

const connection = new web3.Connection(customRpcUrl, "confirmed");

const senderKeypair = web3.Keypair.fromSecretKey(senderSecretKey);

async function sendTransactionWithTimeout(transaction, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Transaction confirmation timeout"));
    }, timeoutMs);

    web3
      .sendAndConfirmTransaction(connection, transaction, [senderKeypair], {
        commitment: "confirmed",
      })
      .then((confirmation) => {
        clearTimeout(timeout);
        resolve(confirmation);
      })
      .catch(reject);
  });
}

async function sendTransferWithRetryAndTimeout(to, retries = 0) {
  try {
    console.log(`检查 ${to} 余额`);
    const toPubkey = new web3.PublicKey(to);
    const balance = await connection.getBalance(toPubkey);
    if (balance / web3.LAMPORTS_PER_SOL > 0.1) {
      console.log(
        `${to} 余额为 ${balance / web3.LAMPORTS_PER_SOL} SOL，无需转账`
      );
      return;
    }
    console.log(`开始向 ${to} 转账，第 ${retries + 1} 次`);
    const transaction = new web3.Transaction()
      .add(
        web3.SystemProgram.transfer({
          fromPubkey: senderKeypair.publicKey,
          toPubkey: toPubkey,
          lamports: 100000000,
        })
      );

    await sendTransactionWithTimeout(transaction, timeoutMs);
    console.log(`转账成功: ${to}`);
  } catch (error) {
    console.error(`转账失败: ${error.message}`);
    if (retries < maxRetries) {
      console.log(`重试转账 ${to}... 尝试次数: ${retries + 1}`);
      await sendTransferWithRetryAndTimeout(to, retries + 1);
    } else {
      console.error(`转账最终失败，达到最大重试次数: ${to}`);
    }
  }
}

async function main() {
  transfers.forEach(async (batch) => {
    for (const to of batch.addresses) {
      await sendTransferWithRetryAndTimeout(to);
    }
    console.log(batch.batchName, "转账完成");
  });
}

main();
