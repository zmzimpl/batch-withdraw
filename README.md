> 以下脚本都需要你的本地环境可以访问外网，建议用 Clash 的 TUN Mode

# Binance

请确保本地时间和网络时间同步，添加 API 的时候勾选了允许提现功能，并绑定了可以调用 API 的 IP

## 运行步骤

- 配置 config.js 和 wallets.json
- 在 binance 目录下执行 `npm i`
- 在 binance 目录下执行 `node index.js`，根据提示输入你要提币的链对应的数字，回车

# OKX

请确保本地时间和网络时间同步，添加 API 的时候勾选了允许提现功能，同时需要把你要提现的目标地址设置为白名单

## 运行步骤

- 配置 config.js 和 wallets.json
- 在 okx 目录下执行 `npm i`
- 在 okx 目录下执行 `node index.js`，根据提示输入你要提币的链对应的数字，回车

# SOL

## 运行步骤

- 配置 index.js 中的发送方私钥，rpc，和接收方地址
- 在 sol 目录下执行 `npm i`
- 在 sol 目录下执行 `node index.js`

