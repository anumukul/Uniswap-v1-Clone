// Contract addresses on Sepolia
export const FACTORY_ADDRESS = "0x43282B62Dc6A35cBC7E0598E158C70EDc5eB5C0d";
export const EXCHANGE_TEMPLATE_ADDRESS ="0xB7b2df7DD8f36444eDDFcb645dc513627dE1E7B9";

// Sepolia testnet
export const SEPOLIA_CHAIN_ID = 11155111;

// Common token addresses on Sepolia (for testing)
export const COMMON_TOKENS: { [key: string]: { address: string; symbol: string; decimals: number } } = {
  USDC: {
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", 
    symbol: "USDC",
    decimals: 6,
  },
  DAI: {
    address: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6", 
    symbol: "DAI",
    decimals: 18,
  },
};
