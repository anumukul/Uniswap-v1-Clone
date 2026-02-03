# Uniswap V1 Clone (Solidity)

A complete clone of Uniswap V1 written in **Solidity**, deployed on Ethereum Sepolia testnet.

## 🚀 Features

- **Original Uniswap V1 Logic**: Converted from Vyper to Solidity
- **Swap Tokens**: Swap between ETH and ERC20 tokens
- **Liquidity Management**: Add and remove liquidity from pools
- **Create Exchanges**: Deploy new exchanges for any ERC20 token
- **0.3% Trading Fee**: Same fee structure as original Uniswap V1

## 📋 Prerequisites

- Node.js 18+
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file:

```bash
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here
```

### 3. Compile Contracts

```bash
npm run compile
```

### 4. Deploy to Sepolia

```bash
npm run deploy:sepolia
```

## 📁 Contract Structure

- `UniswapFactory.sol` - Factory contract for creating exchanges
- `UniswapExchange.sol` - Exchange contract for swaps and liquidity
- `IERC20.sol` - ERC20 interface
- `IUniswapFactory.sol` - Factory interface

## 🎯 Deployment Order

1. Deploy Exchange template
2. Deploy Factory
3. Initialize Factory with Exchange template address

The deployment script handles this automatically.

## 📝 Notes

- Contracts use Solidity 0.8.20
- Same constant product formula (x * y = k) as original
- 0.3% trading fee (997/1000)
- Compatible with all ERC20 tokens
