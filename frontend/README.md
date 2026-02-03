# Uniswap V1 Frontend

Modern frontend for Uniswap V1 DEX.

## Features

- Swap Tokens: ETH ↔ Token, Token ↔ ETH, Token ↔ Token
- Liquidity Management: Add and remove liquidity
- Create Exchanges: Deploy new exchanges for any ERC20 token
- Real-time Prices: See swap rates and prices
- Modern UI: Gradient design with smooth animations

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment (Optional)

Create a `.env.local` file:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Get a WalletConnect Project ID at: https://cloud.walletconnect.com/

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Contract Addresses

The frontend is configured to use the deployed contracts on Sepolia:

- **Factory**: `0x516DE28311E9A20b9cA4C7CE1386A86E188a3D67`
- **Exchange Template**: `0x6D95A488ec402849636b38d6038C9bbEc974F784`

These are set in `config/contracts.ts`.

## Usage

1. **Connect Wallet**: Click "Connect Wallet" in the top right
2. **Swap**: 
   - Select swap type (ETH→Token, Token→ETH, Token→Token)
   - Enter token address and amount
   - Click "Swap"
3. **Liquidity**:
   - Enter token address
   - Add or remove liquidity
4. **Create Exchange**:
   - Enter ERC20 token address
   - Click "Create Exchange"

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Wagmi** - Ethereum React hooks
- **ConnectKit** - Wallet connection UI
- **Viem** - Ethereum library
