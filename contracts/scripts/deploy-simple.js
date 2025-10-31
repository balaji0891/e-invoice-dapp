import hre from "hardhat";

async function main() {
  console.log("Deploying InvoiceManagerSimple contract to Sepolia...");

  const InvoiceManager = await hre.ethers.getContractFactory("InvoiceManagerSimple");
  const invoiceManager = await InvoiceManager.deploy();

  await invoiceManager.waitForDeployment();

  const address = await invoiceManager.getAddress();
  console.log("InvoiceManagerSimple deployed to:", address);
  console.log("\nUpdate your .env file with:");
  console.log(`VITE_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
