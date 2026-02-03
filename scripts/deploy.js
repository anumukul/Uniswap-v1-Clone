const hre = require("hardhat");

async function main() {
  console.log("Deploying Uniswap V1 contracts to", hre.network.name, "network...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Step 1: Deploy Exchange template
  console.log("\nStep 1: Deploying Exchange template...");
  const Exchange = await hre.ethers.getContractFactory("UniswapExchange");
  const exchangeTemplate = await Exchange.deploy();
  await exchangeTemplate.waitForDeployment();
  const exchangeAddress = await exchangeTemplate.getAddress();
  console.log("✅ Exchange template deployed at:", exchangeAddress);

  // Step 2: Deploy Factory
  console.log("\nStep 2: Deploying Factory...");
  const Factory = await hre.ethers.getContractFactory("UniswapFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ Factory deployed at:", factoryAddress);

  // Step 3: Initialize Factory
  console.log("\nStep 3: Initializing Factory...");
  const initTx = await factory.initializeFactory(exchangeAddress);
  await initTx.wait();
  console.log("✅ Factory initialized");

  console.log("\n" + "=".repeat(60));
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\nFactory Address:", factoryAddress);
  console.log("Exchange Template Address:", exchangeAddress);
  console.log("\n💡 Save these addresses for your frontend!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
