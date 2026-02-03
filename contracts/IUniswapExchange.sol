// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUniswapExchange {
    function ethToTokenSwapInput(uint256 minTokens, uint256 deadline) external payable returns (uint256);
    function ethToTokenSwapOutput(uint256 tokensBought, uint256 deadline) external payable returns (uint256);
    function ethToTokenTransferInput(uint256 minTokens, uint256 deadline, address recipient) external payable returns (uint256);
    function ethToTokenTransferOutput(uint256 tokensBought, uint256 deadline, address recipient) external payable returns (uint256);
    function getEthToTokenInputPrice(uint256 ethSold) external view returns (uint256);
    function getEthToTokenOutputPrice(uint256 tokensBought) external view returns (uint256);
}
