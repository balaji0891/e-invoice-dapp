import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("🚀 Deploying InvoiceManager contract to Sepolia...");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  const InvoiceManager = await ethers.getContractFactory("InvoiceManager");
  console.log("⏳ Deploying contract...");
  
  const invoiceManager = await InvoiceManager.deploy();
  await invoiceManager.waitForDeployment();

  const contractAddress = await invoiceManager.getAddress();
  console.log("✅ InvoiceManager deployed to:", contractAddress);
  console.log("\n📋 Next steps:");
  console.log("1. Add this contract address to Replit Secrets:");
  console.log("   Key: VITE_CONTRACT_ADDRESS");
  console.log("   Value:", contractAddress);
  console.log("\n2. Verify on Sepolia Etherscan:");
  console.log("   https://sepolia.etherscan.io/address/" + contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
