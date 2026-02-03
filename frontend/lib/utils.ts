import { formatEther as viemFormatEther, parseEther as viemParseEther, formatUnits as viemFormatUnits, parseUnits as viemParseUnits } from "viem";

export const formatEther = (value: bigint | string): string => {
  const bigintValue = typeof value === 'string' ? BigInt(value) : value;
  return viemFormatEther(bigintValue);
};

export const parseEther = (value: string): bigint => {
  return viemParseEther(value);
};

export const formatUnits = (value: bigint | string, decimals: number = 18): string => {
  const bigintValue = typeof value === 'string' ? BigInt(value) : value;
  return viemFormatUnits(bigintValue, decimals);
};

export const parseUnits = (value: string, decimals: number = 18): bigint => {
  return viemParseUnits(value, decimals);
};

export const getDeadline = (minutes: number = 20) => {
  return Math.floor(Date.now() / 1000) + minutes * 60;
};

export const shortenAddress = (address: string, chars: number = 4) => {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

export const calculateSlippage = (amount: bigint, slippagePercent: number = 0.5) => {
  const slippage = (amount * BigInt(Math.floor(slippagePercent * 100))) / BigInt(10000);
  return amount - slippage;
};
