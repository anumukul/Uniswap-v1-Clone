// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUniswapFactory {
    function getExchange(address token) external view returns (address);
    function createExchange(address token) external returns (address);
}
