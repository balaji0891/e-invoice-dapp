import { ethers } from "hardhat";

async function main() {
  console.log("Deploying InvoiceManager contract to Sepolia...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy InvoiceManager
  const InvoiceManager = await ethers.getContractFactory("InvoiceManager");
  const invoiceManager = await InvoiceManager.deploy();

  await invoiceManager.waitForDeployment();
  const contractAddress = await invoiceManager.getAddress();

  console.log("InvoiceManager deployed to:", contractAddress);
  console.log("\nDeployment complete!");
  console.log("Save this address in your .env file as:");
  console.log(`VITE_CONTRACT_ADDRESS=${contractAddress}`);

  // Verify deployment
  const totalInvoices = await invoiceManager.getTotalInvoices();
  console.log("\nInitial invoice count:", totalInvoices.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
