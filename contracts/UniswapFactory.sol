// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./UniswapExchange.sol";
import "./IUniswapFactory.sol";

contract UniswapFactory is IUniswapFactory {
    address public exchangeTemplate;
    uint256 public tokenCount;
    mapping(address => address) public tokenToExchange;
    mapping(address => address) public exchangeToToken;
    mapping(uint256 => address) public idToToken;
    
    event NewExchange(address indexed token, address indexed exchange);
    
    function initializeFactory(address template) external {
        require(exchangeTemplate == address(0), "Already initialized");
        require(template != address(0), "Invalid template");
        exchangeTemplate = template;
    }
    
    function createExchange(address token) external override returns (address) {
        require(token != address(0), "Invalid token");
        require(exchangeTemplate != address(0), "Factory not initialized");
        require(tokenToExchange[token] == address(0), "Exchange exists");
        
        UniswapExchange exchange = new UniswapExchange();
        exchange.setup(token);
        address exchangeAddress = address(exchange);
        
        tokenToExchange[token] = exchangeAddress;
        exchangeToToken[exchangeAddress] = token;
        tokenCount += 1;
        idToToken[tokenCount] = token;
        
        emit NewExchange(token, exchangeAddress);
        return exchangeAddress;
    }
    
    function getExchange(address token) external view override returns (address) {
        return tokenToExchange[token];
    }
    
    function getToken(address exchange) external view returns (address) {
        return exchangeToToken[exchange];
    }
    
    function getTokenWithId(uint256 tokenId) external view returns (address) {
        return idToToken[tokenId];
    }
}
