import { expect } from "chai";
import { ethers } from "hardhat";

describe("InvoiceManager", function () {
  let invoiceManager;
  let owner, sender, recipient;

  beforeEach(async function () {
    [owner, sender, recipient] = await ethers.getSigners();
    
    const InvoiceManager = await ethers.getContractFactory("InvoiceManager");
    invoiceManager = await InvoiceManager.deploy();
    await invoiceManager.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should initialize with zero invoices", async function () {
      expect(await invoiceManager.getTotalInvoices()).to.equal(0);
    });
  });

  describe("Invoice Management", function () {
    it("Should track sent and received invoices", async function () {
      const sentInvoices = await invoiceManager.getSentInvoices(sender.address);
      const receivedInvoices = await invoiceManager.getReceivedInvoices(recipient.address);
      
      expect(sentInvoices.length).to.equal(0);
      expect(receivedInvoices.length).to.equal(0);
    });
  });
});
