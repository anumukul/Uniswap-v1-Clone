import { ethers } from "ethers";

export const formatEther = (value: bigint | string) => {
  return ethers.formatEther(value);
};

export const parseEther = (value: string) => {
  return ethers.parseEther(value);
};

export const formatUnits = (value: bigint | string, decimals: number = 18) => {
  return ethers.formatUnits(value, decimals);
};

export const parseUnits = (value: string, decimals: number = 18) => {
  return ethers.parseUnits(value, decimals);
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
