# Uniswap V1 Clone

A full implementation of Uniswap V1 built with Solidity and a modern React frontend. This project recreates the original Uniswap V1 protocol functionality, including token swaps, liquidity provision, and exchange creation.

## What This Is

This is a complete recreation of Uniswap V1, the first version of the popular decentralized exchange. The smart contracts have been converted from Vyper to Solidity while maintaining the exact same functionality and economic model. The frontend provides a clean interface for interacting with the protocol.

The project is deployed on Ethereum Sepolia testnet and ready for testing and experimentation.

## Project Structure

The repository is split into two main parts:

- **Smart Contracts** (`/contracts`): The core Uniswap V1 protocol contracts written in Solidity
- **Frontend** (`/frontend`): A Next.js application for interacting with the deployed contracts

## Smart Contracts

### Core Contracts

**UniswapFactory.sol** - The factory contract that creates and manages exchange instances. Each ERC20 token gets its own exchange contract through this factory.

**UniswapExchange.sol** - The exchange contract that handles all trading and liquidity operations. This is the contract that gets deployed for each token pair.

**Interfaces** - Standard interfaces for ERC20 tokens and the factory contract to enable type-safe interactions.

### How It Works

The protocol uses the constant product formula (x * y = k) to determine swap prices. When you add liquidity, you provide both ETH and tokens in a ratio that matches the current reserves. When you swap, the contract calculates the output amount based on the constant product formula, ensuring that the product of reserves remains constant (minus the 0.3% trading fee).

The 0.3% fee is taken from each swap and added to the liquidity pool, rewarding liquidity providers.

## Frontend

The frontend is built with Next.js 14 and TypeScript. It uses Wagmi for Ethereum interactions and provides a clean interface for all protocol operations.

### Features

**Token Swapping** - Swap between ETH and any ERC20 token, or between two different tokens. The interface shows real-time prices and calculates output amounts automatically.

**Liquidity Management** - Add liquidity to existing pools or remove your liquidity position. The interface calculates the required token amounts based on your ETH input.

**Exchange Creation** - Deploy new exchange contracts for any ERC20 token. Once created, anyone can add liquidity and start trading.

**Token Discovery** - Browse all tokens that have exchanges created on the protocol. Search by name, symbol, or address.

## Getting Started

### Prerequisites

You'll need Node.js 18 or higher installed. For interacting with the frontend, you'll need a Web3 wallet like MetaMask. Make sure you have some Sepolia testnet ETH for gas fees.

### Smart Contract Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory:

```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here
```

You can get a free RPC URL from Alchemy or Infura. Make sure to use a test account's private key, never your mainnet key.

3. Compile the contracts:

```bash
npm run compile
```

4. Deploy to Sepolia:

```bash
npm run deploy:sepolia
```

The deployment script will output the factory and exchange template addresses. Save these for the frontend configuration.

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
npm install
```

2. Update the contract addresses in `config/contracts.ts` with the addresses from your deployment.

3. Optionally, create a `.env.local` file for WalletConnect support:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

You can get a WalletConnect project ID from https://cloud.walletconnect.com/. This is optional - the app works fine without it.

4. Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Usage

### Connecting Your Wallet

Click the "Connect Wallet" button in the top right. The app supports MetaMask and other injected wallets. If you're on the wrong network, you'll see a warning banner with an option to switch to Sepolia.

### Swapping Tokens

1. Go to the Swap tab
2. Select your input token (ETH or any ERC20 token)
3. Select your output token
4. Enter the amount you want to swap
5. Review the output amount and price
6. Click Swap and confirm the transaction

For token-to-token swaps, you'll need to approve the token first. The app handles this automatically.

### Adding Liquidity

1. Go to the Liquidity tab
2. Enter the token address for the pair you want to provide liquidity for
3. Enter the amount of ETH you want to deposit
4. The app will calculate the required token amount based on the current reserves
5. Click "Add Liquidity" and confirm the transaction

For the first liquidity provision, you set the initial price ratio. For subsequent additions, you must match the existing ratio.

### Removing Liquidity

1. Go to the Liquidity tab
2. Make sure you're on the "Remove" action
3. Enter the token address
4. Enter the amount of liquidity tokens you want to burn
5. Review the estimated ETH and token amounts you'll receive
6. Click "Remove Liquidity" and confirm

### Creating Exchanges

1. Go to the Create Exchange tab
2. Enter the ERC20 token address
3. Click "Create Exchange"
4. Wait for the transaction to confirm

Once created, the exchange address will be displayed. You can then add liquidity and start trading.

## Testing

Run the test suite to verify contract functionality:

```bash
npm test
```

The tests cover all major functions including swaps, liquidity operations, and edge cases like slippage protection and deadline enforcement.

## Technical Details

### Smart Contracts

- Solidity version: 0.8.20
- Network: Ethereum Sepolia testnet
- Trading fee: 0.3% (997/1000)
- Formula: Constant product (x * y = k)

### Frontend

- Framework: Next.js 14
- Language: TypeScript
- Styling: Tailwind CSS
- Ethereum library: Wagmi + Viem
- State management: React hooks

### Contract Addresses

The deployed contract addresses are configured in `frontend/config/contracts.ts`. Update these after deploying your own contracts.

## Common Issues

**Transaction fails with "insufficient funds"** - Make sure you have enough Sepolia ETH for gas fees. You can get testnet ETH from a faucet.

**Token approval required** - When swapping tokens, you need to approve the exchange contract first. The frontend handles this automatically, but you'll see two transactions.

**Exchange already exists** - Each token can only have one exchange. If you see this error, the exchange was already created. You can find the address using the factory's `getExchange` function.

**Wrong network** - Make sure you're connected to Sepolia testnet. The app will show a warning if you're on the wrong network.

## Development

### Contract Development

The contracts follow the original Uniswap V1 design closely. Key differences from the Vyper version:

- Uses Solidity 0.8.20 instead of Vyper
- Same constant product formula and fee structure
- Same event structure for compatibility

### Frontend Development

The frontend uses React Server Components where possible, with client components for wallet interactions. All Ethereum interactions go through Wagmi hooks for type safety and automatic retry logic.

## License

This project is for educational purposes. Uniswap V1 is open source and this implementation maintains compatibility with the original protocol.

## Acknowledgments

This project is based on the original Uniswap V1 protocol. The smart contracts have been converted from Vyper to Solidity while maintaining functional equivalence.
