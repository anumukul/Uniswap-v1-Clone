// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC20.sol";
import "./IUniswapFactory.sol";
import "./IUniswapExchange.sol";

contract UniswapExchange is IERC20 {
    string public constant name = "Uniswap V1";
    string public constant symbol = "UNI-V1";
    uint8 public constant decimals = 18;
    
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    address public token;
    IUniswapFactory public factory;
    
    uint256 private constant FEE_NUMERATOR = 997;
    uint256 private constant FEE_DENOMINATOR = 1000;
    
    event TokenPurchase(address indexed buyer, uint256 ethSold, uint256 tokensBought);
    event EthPurchase(address indexed buyer, uint256 tokensSold, uint256 ethBought);
    event AddLiquidity(address indexed provider, uint256 ethAmount, uint256 tokenAmount);
    event RemoveLiquidity(address indexed provider, uint256 ethAmount, uint256 tokenAmount);
    
    modifier setupOnce() {
        require(address(factory) == address(0) && token == address(0), "Already setup");
        _;
    }
    
    function setup(address tokenAddr) external setupOnce {
        require(tokenAddr != address(0), "Invalid token");
        factory = IUniswapFactory(msg.sender);
        token = tokenAddr;
    }
    
    function addLiquidity(uint256 minLiquidity, uint256 maxTokens, uint256 deadline) 
        external 
        payable 
        returns (uint256) 
    {
        require(deadline >= block.timestamp && maxTokens > 0 && msg.value > 0, "Invalid input");
        uint256 totalLiquidity = totalSupply;
        
        if (totalLiquidity > 0) {
            require(minLiquidity > 0, "Min liquidity required");
            uint256 ethReserve = address(this).balance - msg.value;
            uint256 tokenReserve = IERC20(token).balanceOf(address(this));
            uint256 tokenAmount = (msg.value * tokenReserve / ethReserve) + 1;
            uint256 liquidityMinted = (msg.value * totalLiquidity) / ethReserve;
            
            require(maxTokens >= tokenAmount && liquidityMinted >= minLiquidity, "Slippage");
            balanceOf[msg.sender] += liquidityMinted;
            totalSupply = totalLiquidity + liquidityMinted;
            require(IERC20(token).transferFrom(msg.sender, address(this), tokenAmount), "Transfer failed");
            
            emit AddLiquidity(msg.sender, msg.value, tokenAmount);
            emit Transfer(address(0), msg.sender, liquidityMinted);
            return liquidityMinted;
        } else {
            require(address(factory) != address(0) && token != address(0), "Not initialized");
            require(msg.value >= 1000000000, "Min ETH");
            require(factory.getExchange(token) == address(this), "Invalid exchange");
            
            uint256 tokenAmount = maxTokens;
            uint256 initialLiquidity = address(this).balance;
            totalSupply = initialLiquidity;
            balanceOf[msg.sender] = initialLiquidity;
            require(IERC20(token).transferFrom(msg.sender, address(this), tokenAmount), "Transfer failed");
            
            emit AddLiquidity(msg.sender, msg.value, tokenAmount);
            emit Transfer(address(0), msg.sender, initialLiquidity);
            return initialLiquidity;
        }
    }
    
    function removeLiquidity(uint256 amount, uint256 minEth, uint256 minTokens, uint256 deadline)
        external
        returns (uint256, uint256)
    {
        require(amount > 0 && deadline >= block.timestamp && minEth > 0 && minTokens > 0, "Invalid input");
        uint256 totalLiquidity = totalSupply;
        require(totalLiquidity > 0, "No liquidity");
        
        uint256 tokenReserve = IERC20(token).balanceOf(address(this));
        uint256 ethAmount = (amount * address(this).balance) / totalLiquidity;
        uint256 tokenAmount = (amount * tokenReserve) / totalLiquidity;
        
        require(ethAmount >= minEth && tokenAmount >= minTokens, "Slippage");
        balanceOf[msg.sender] -= amount;
        totalSupply = totalLiquidity - amount;
        
        payable(msg.sender).transfer(ethAmount);
        require(IERC20(token).transfer(msg.sender, tokenAmount), "Transfer failed");
        
        emit RemoveLiquidity(msg.sender, ethAmount, tokenAmount);
        emit Transfer(msg.sender, address(0), amount);
        return (ethAmount, tokenAmount);
    }
    
    function getInputPrice(uint256 inputAmount, uint256 inputReserve, uint256 outputReserve)
        internal
        pure
        returns (uint256)
    {
        require(inputReserve > 0 && outputReserve > 0, "Insufficient liquidity");
        uint256 inputAmountWithFee = inputAmount * FEE_NUMERATOR;
        uint256 numerator = inputAmountWithFee * outputReserve;
        uint256 denominator = (inputReserve * FEE_DENOMINATOR) + inputAmountWithFee;
        return numerator / denominator;
    }
    
    function getOutputPrice(uint256 outputAmount, uint256 inputReserve, uint256 outputReserve)
        internal
        pure
        returns (uint256)
    {
        require(inputReserve > 0 && outputReserve > 0, "Insufficient liquidity");
        uint256 numerator = inputReserve * outputAmount * FEE_DENOMINATOR;
        uint256 denominator = (outputReserve - outputAmount) * FEE_NUMERATOR;
        return (numerator / denominator) + 1;
    }
    
    function ethToTokenSwapInput(uint256 minTokens, uint256 deadline)
        external
        payable
        returns (uint256)
    {
        require(deadline >= block.timestamp && msg.value > 0, "Invalid input");
        uint256 tokenReserve = IERC20(token).balanceOf(address(this));
        uint256 tokensBought = getInputPrice(msg.value, address(this).balance - msg.value, tokenReserve);
        require(tokensBought >= minTokens, "Slippage");
        require(IERC20(token).transfer(msg.sender, tokensBought), "Transfer failed");
        emit TokenPurchase(msg.sender, msg.value, tokensBought);
        return tokensBought;
    }
    
    function ethToTokenSwapOutput(uint256 tokensBought, uint256 deadline)
        external
        payable
        returns (uint256)
    {
        require(deadline >= block.timestamp && tokensBought > 0, "Invalid input");
        uint256 tokenReserve = IERC20(token).balanceOf(address(this));
        // Calculate ETH needed BEFORE receiving the msg.value
        uint256 ethReserve = address(this).balance - msg.value;
        uint256 ethSold = getOutputPrice(tokensBought, ethReserve, tokenReserve);
        require(msg.value >= ethSold, "Insufficient ETH");
        uint256 ethRefund = msg.value - ethSold;
        if (ethRefund > 0) {
            payable(msg.sender).transfer(ethRefund);
        }
        require(IERC20(token).transfer(msg.sender, tokensBought), "Transfer failed");
        emit TokenPurchase(msg.sender, ethSold, tokensBought);
        return ethSold;
    }
    
    function tokenToEthSwapInput(uint256 tokensSold, uint256 minEth, uint256 deadline)
        external
        returns (uint256)
    {
        require(deadline >= block.timestamp && tokensSold > 0 && minEth > 0, "Invalid input");
        uint256 tokenReserve = IERC20(token).balanceOf(address(this));
        uint256 ethBought = getInputPrice(tokensSold, tokenReserve, address(this).balance);
        require(ethBought >= minEth, "Slippage");
        require(IERC20(token).transferFrom(msg.sender, address(this), tokensSold), "Transfer failed");
        payable(msg.sender).transfer(ethBought);
        emit EthPurchase(msg.sender, tokensSold, ethBought);
        return ethBought;
    }
    
    function tokenToEthSwapOutput(uint256 ethBought, uint256 maxTokens, uint256 deadline)
        external
        returns (uint256)
    {
        require(deadline >= block.timestamp && ethBought > 0, "Invalid input");
        uint256 tokenReserve = IERC20(token).balanceOf(address(this));
        uint256 tokensSold = getOutputPrice(ethBought, tokenReserve, address(this).balance);
        require(maxTokens >= tokensSold, "Slippage");
        require(IERC20(token).transferFrom(msg.sender, address(this), tokensSold), "Transfer failed");
        payable(msg.sender).transfer(ethBought);
        emit EthPurchase(msg.sender, tokensSold, ethBought);
        return tokensSold;
    }
    
    function getEthToTokenInputPrice(uint256 ethSold) external view returns (uint256) {
        require(ethSold > 0, "Invalid input");
        uint256 tokenReserve = IERC20(token).balanceOf(address(this));
        return getInputPrice(ethSold, address(this).balance, tokenReserve);
    }
    
    function getEthToTokenOutputPrice(uint256 tokensBought) external view returns (uint256) {
        require(tokensBought > 0, "Invalid input");
        uint256 tokenReserve = IERC20(token).balanceOf(address(this));
        uint256 ethReserve = address(this).balance;
        return getOutputPrice(tokensBought, ethReserve, tokenReserve);
    }
    
    function getTokenToEthInputPrice(uint256 tokensSold) external view returns (uint256) {
        require(tokensSold > 0, "Invalid input");
        uint256 tokenReserve = IERC20(token).balanceOf(address(this));
        return getInputPrice(tokensSold, tokenReserve, address(this).balance);
    }
    
    function getTokenToEthOutputPrice(uint256 ethBought) external view returns (uint256) {
        require(ethBought > 0, "Invalid input");
        uint256 tokenReserve = IERC20(token).balanceOf(address(this));
        return getOutputPrice(ethBought, tokenReserve, address(this).balance);
    }
    
    // ERC20 functions
    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function tokenToTokenSwapInput(
        uint256 tokensSold,
        uint256 minTokensBought,
        uint256 minEthBought,
        uint256 deadline,
        address tokenAddr
    ) external returns (uint256) {
        address exchangeAddr = factory.getExchange(tokenAddr);
        return tokenToTokenInput(tokensSold, minTokensBought, minEthBought, deadline, exchangeAddr);
    }
    
    function tokenToTokenInput(
        uint256 tokensSold,
        uint256 minTokensBought,
        uint256 minEthBought,
        uint256 deadline,
        address exchangeAddr
    ) internal returns (uint256) {
        require(deadline >= block.timestamp && tokensSold > 0 && minTokensBought > 0 && minEthBought > 0, "Invalid input");
        require(exchangeAddr != address(this) && exchangeAddr != address(0), "Invalid exchange");
        
        uint256 tokenReserve = IERC20(token).balanceOf(address(this));
        uint256 ethBought = getInputPrice(tokensSold, tokenReserve, address(this).balance);
        require(ethBought >= minEthBought, "Slippage");
        require(IERC20(token).transferFrom(msg.sender, address(this), tokensSold), "Transfer failed");
        
        IUniswapExchange exchange = IUniswapExchange(payable(exchangeAddr));
        uint256 tokensBought = exchange.ethToTokenSwapInput{value: ethBought}(minTokensBought, deadline);
        
        emit EthPurchase(msg.sender, tokensSold, ethBought);
        return tokensBought;
    }
    
    function tokenToTokenSwapOutput(
        uint256 tokensBought,
        uint256 maxTokensSold,
        uint256 maxEthSold,
        uint256 deadline,
        address tokenAddr
    ) external returns (uint256) {
        address exchangeAddr = factory.getExchange(tokenAddr);
        return tokenToTokenOutput(tokensBought, maxTokensSold, maxEthSold, deadline, exchangeAddr);
    }
    
    function tokenToTokenOutput(
        uint256 tokensBought,
        uint256 maxTokensSold,
        uint256 maxEthSold,
        uint256 deadline,
        address exchangeAddr
    ) internal returns (uint256) {
        require(deadline >= block.timestamp && tokensBought > 0 && maxEthSold > 0, "Invalid input");
        require(exchangeAddr != address(this) && exchangeAddr != address(0), "Invalid exchange");
        
        IUniswapExchange exchange = IUniswapExchange(payable(exchangeAddr));
        uint256 ethBought = exchange.getEthToTokenOutputPrice(tokensBought);
        require(maxEthSold >= ethBought, "Slippage");
        
        uint256 tokenReserve = IERC20(token).balanceOf(address(this));
        uint256 tokensSold = getOutputPrice(ethBought, tokenReserve, address(this).balance);
        require(maxTokensSold >= tokensSold, "Slippage");
        require(IERC20(token).transferFrom(msg.sender, address(this), tokensSold), "Transfer failed");
        
        // Use transferOutput to send tokens to the original caller, not to this contract
        exchange.ethToTokenTransferOutput{value: ethBought}(tokensBought, deadline, msg.sender);
        
        emit EthPurchase(msg.sender, tokensSold, ethBought);
        return tokensSold;
    }
    
    function ethToTokenTransferInput(uint256 minTokens, uint256 deadline, address recipient)
        external
        payable
        returns (uint256)
    {
        require(deadline >= block.timestamp && msg.value > 0 && recipient != address(0), "Invalid input");
        uint256 tokenReserve = IERC20(token).balanceOf(address(this));
        uint256 tokensBought = getInputPrice(msg.value, address(this).balance - msg.value, tokenReserve);
        require(tokensBought >= minTokens, "Slippage");
        require(IERC20(token).transfer(recipient, tokensBought), "Transfer failed");
        emit TokenPurchase(msg.sender, msg.value, tokensBought);
        return tokensBought;
    }
    
    function ethToTokenTransferOutput(uint256 tokensBought, uint256 deadline, address recipient)
        external
        payable
        returns (uint256)
    {
        require(deadline >= block.timestamp && tokensBought > 0 && recipient != address(0), "Invalid input");
        uint256 tokenReserve = IERC20(token).balanceOf(address(this));
        // Calculate ETH needed BEFORE receiving the msg.value
        uint256 ethReserve = address(this).balance - msg.value;
        uint256 ethSold = getOutputPrice(tokensBought, ethReserve, tokenReserve);
        require(msg.value >= ethSold, "Insufficient ETH");
        uint256 ethRefund = msg.value - ethSold;
        if (ethRefund > 0) {
            payable(msg.sender).transfer(ethRefund);
        }
        require(IERC20(token).transfer(recipient, tokensBought), "Transfer failed");
        emit TokenPurchase(msg.sender, ethSold, tokensBought);
        return ethSold;
    }
    
    function tokenToEthTransferInput(uint256 tokensSold, uint256 minEth, uint256 deadline, address recipient)
        external
        returns (uint256)
    {
        require(deadline >= block.timestamp && tokensSold > 0 && minEth > 0 && recipient != address(0), "Invalid input");
        uint256 tokenReserve = IERC20(token).balanceOf(address(this));
        uint256 ethBought = getInputPrice(tokensSold, tokenReserve, address(this).balance);
        require(ethBought >= minEth, "Slippage");
        require(IERC20(token).transferFrom(msg.sender, address(this), tokensSold), "Transfer failed");
        payable(recipient).transfer(ethBought);
        emit EthPurchase(msg.sender, tokensSold, ethBought);
        return ethBought;
    }
    
    function tokenToEthTransferOutput(uint256 ethBought, uint256 maxTokens, uint256 deadline, address recipient)
        external
        returns (uint256)
    {
        require(deadline >= block.timestamp && ethBought > 0 && recipient != address(0), "Invalid input");
        uint256 tokenReserve = IERC20(token).balanceOf(address(this));
        uint256 tokensSold = getOutputPrice(ethBought, tokenReserve, address(this).balance);
        require(maxTokens >= tokensSold, "Slippage");
        require(IERC20(token).transferFrom(msg.sender, address(this), tokensSold), "Transfer failed");
        payable(recipient).transfer(ethBought);
        emit EthPurchase(msg.sender, tokensSold, ethBought);
        return tokensSold;
    }
    
    function tokenToTokenTransferInput(
        uint256 tokensSold,
        uint256 minTokensBought,
        uint256 minEthBought,
        uint256 deadline,
        address tokenAddr,
        address recipient
    ) external returns (uint256) {
        address exchangeAddr = factory.getExchange(tokenAddr);
        return tokenToTokenTransferInputInternal(tokensSold, minTokensBought, minEthBought, deadline, exchangeAddr, recipient);
    }
    
    function tokenToTokenTransferInputInternal(
        uint256 tokensSold,
        uint256 minTokensBought,
        uint256 minEthBought,
        uint256 deadline,
        address exchangeAddr,
        address recipient
    ) internal returns (uint256) {
        require(deadline >= block.timestamp && tokensSold > 0 && minTokensBought > 0 && minEthBought > 0 && recipient != address(0), "Invalid input");
        require(exchangeAddr != address(this) && exchangeAddr != address(0), "Invalid exchange");
        
        uint256 tokenReserve = IERC20(token).balanceOf(address(this));
        uint256 ethBought = getInputPrice(tokensSold, tokenReserve, address(this).balance);
        require(ethBought >= minEthBought, "Slippage");
        require(IERC20(token).transferFrom(msg.sender, address(this), tokensSold), "Transfer failed");
        
        IUniswapExchange exchange = IUniswapExchange(payable(exchangeAddr));
        uint256 tokensBought = exchange.ethToTokenTransferInput{value: ethBought}(minTokensBought, deadline, recipient);
        
        emit EthPurchase(msg.sender, tokensSold, ethBought);
        return tokensBought;
    }
    
    function tokenToTokenTransferOutput(
        uint256 tokensBought,
        uint256 maxTokensSold,
        uint256 maxEthSold,
        uint256 deadline,
        address tokenAddr,
        address recipient
    ) external returns (uint256) {
        address exchangeAddr = factory.getExchange(tokenAddr);
        return tokenToTokenTransferOutputInternal(tokensBought, maxTokensSold, maxEthSold, deadline, exchangeAddr, recipient);
    }
    
    function tokenToTokenTransferOutputInternal(
        uint256 tokensBought,
        uint256 maxTokensSold,
        uint256 maxEthSold,
        uint256 deadline,
        address exchangeAddr,
        address recipient
    ) internal returns (uint256) {
        require(deadline >= block.timestamp && tokensBought > 0 && maxEthSold > 0 && recipient != address(0), "Invalid input");
        require(exchangeAddr != address(this) && exchangeAddr != address(0), "Invalid exchange");
        
        IUniswapExchange exchange = IUniswapExchange(payable(exchangeAddr));
        uint256 ethBought = exchange.getEthToTokenOutputPrice(tokensBought);
        require(maxEthSold >= ethBought, "Slippage");
        
        uint256 tokenReserve = IERC20(token).balanceOf(address(this));
        uint256 tokensSold = getOutputPrice(ethBought, tokenReserve, address(this).balance);
        require(maxTokensSold >= tokensSold, "Slippage");
        require(IERC20(token).transferFrom(msg.sender, address(this), tokensSold), "Transfer failed");
        
        exchange.ethToTokenTransferOutput{value: ethBought}(tokensBought, deadline, recipient);
        
        emit EthPurchase(msg.sender, tokensSold, ethBought);
        return tokensSold;
    }
    
    function factoryAddress() external view returns (address) {
        return address(factory);
    }
    
    function tokenAddress() external view returns (address) {
        return token;
    }
    
    receive() external payable {
        // Only execute swap on direct ETH transfers (not from contract calls)
        // receive() is NOT called when using .value() in function calls, so this is safe
        if (msg.value > 0 && token != address(0) && totalSupply > 0) {
            uint256 tokenReserve = IERC20(token).balanceOf(address(this));
            uint256 ethReserve = address(this).balance - msg.value;
            
            // Only swap if we have sufficient reserves
            if (tokenReserve > 0 && ethReserve > 0) {
                uint256 tokensBought = getInputPrice(msg.value, ethReserve, tokenReserve);
                // Ensure we have enough tokens
                if (tokensBought > 0 && tokensBought <= tokenReserve) {
                    // Try to transfer tokens - if it fails, just revert the receive
                    // This allows direct ETH swaps but won't interfere with function calls
                    bool success = IERC20(token).transfer(msg.sender, tokensBought);
                    if (success) {
                        emit TokenPurchase(msg.sender, msg.value, tokensBought);
                    }
                }
            }
        }
    }
}
