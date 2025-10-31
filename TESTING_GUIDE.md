# e-Invoice dApp Testing Guide

## 🎯 Overview
This guide will help you test the complete functionality of your e-Invoice dApp on Ethereum Sepolia testnet.

## ✅ Prerequisites
Before testing, ensure you have:
1. **MetaMask wallet** installed in your browser
2. **Sepolia testnet** configured in MetaMask
3. **Test ETH** in your wallet (get from faucets below)
4. **Two wallet addresses** for full testing (sender and recipient)

### Getting Test ETH
- **Alchemy Faucet**: https://sepoliafaucet.com/
- **Infura Faucet**: https://www.infura.io/faucet/sepolia
- **Chainlink Faucet**: https://faucets.chain.link/sepolia

Request 0.5-1 ETH to cover transaction gas fees.

## 📋 Testing Workflow

### Step 1: Connect Your Wallet
1. Click **"Connect Wallet"** button in the top right
2. Approve the MetaMask connection
3. Ensure you're on **Sepolia testnet** (network ID: 11155111)
   - If not, click "Switch to Sepolia" when prompted

**Expected Result**: Your wallet address should appear in the top right corner

---

### Step 2: Create an Invoice (Sender)
1. Click **"+ Create New Invoice"** button
2. Fill out the form:
   - **Recipient Address**: Enter the Ethereum address that will receive the invoice
     - Example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
   - **Description**: Enter invoice details
     - Example: "Web Development Services - October 2025"
   - **Amount**: Enter the invoice amount in ETH
     - Example: `0.01` (this is the amount recipient must pay)
   - **Due Date**: Select a future date

3. Click **"Create Invoice"**
4. **Approve the transaction** in MetaMask
   - Gas fees will be ~0.001-0.003 ETH
   - Wait for transaction confirmation

**Expected Results**:
- ✅ Success notification: "Invoice created successfully on blockchain!"
- ✅ Invoice appears in **"Sent Invoices"** tab
- ✅ Transaction recorded on Sepolia blockchain
- ✅ Invoice shows as **"Pending"** status

**Troubleshooting**:
- If transaction fails, ensure you have enough ETH for gas fees
- Check MetaMask for error messages
- Verify recipient address is valid (42 characters starting with 0x)

---

### Step 3: View Received Invoice (Recipient)
1. Switch to a **different MetaMask account** (the recipient address)
2. Click **"Connect Wallet"** with the recipient's account
3. Navigate to **"Received Invoices"** tab

**Expected Results**:
- ✅ Invoice created in Step 2 appears in the list
- ✅ Shows sender's address, description, and amount
- ✅ Status shows **"Pending"**
- ✅ **"Pay Invoice"** button is visible

---

### Step 4: Pay an Invoice (Recipient)
1. In **"Received Invoices"** tab, find the invoice to pay
2. Click **"Pay Invoice"** button
3. **Approve the transaction** in MetaMask
   - Transaction will send the **exact invoice amount** + gas fees
   - Example: 0.01 ETH invoice amount + ~0.001 ETH gas
4. Wait for transaction confirmation

**Expected Results**:
- ✅ Success notification: "Payment successful! Invoice paid."
- ✅ Invoice status changes to **"Paid"** (green badge)
- ✅ ETH transferred from recipient to sender
- ✅ Payment timestamp recorded
- ✅ Both sender and recipient see updated status

**Troubleshooting**:
- Ensure recipient wallet has enough ETH for invoice amount + gas
- Transaction will fail if exact amount doesn't match
- Check Sepolia block explorer for transaction status

---

### Step 5: Verify Payment (Sender)
1. Switch back to the **sender's MetaMask account**
2. Check **"Sent Invoices"** tab

**Expected Results**:
- ✅ Invoice status updated to **"Paid"** (green badge)
- ✅ Payment timestamp displayed
- ✅ Real-time update without page refresh (via event listeners)
- ✅ ETH received in sender's wallet

---

### Step 6: Cancel an Invoice (Sender)
1. Create a test invoice (follow Step 2)
2. In **"Sent Invoices"** tab, find an **unpaid** invoice
3. Click **"Cancel Invoice"** button
4. **Approve the transaction** in MetaMask
5. Wait for confirmation

**Expected Results**:
- ✅ Success notification: "Invoice cancelled!"
- ✅ Invoice status changes to **"Cancelled"** (gray badge)
- ✅ Recipient can no longer pay this invoice
- ✅ Both parties see updated status

**Note**: Only unpaid invoices can be cancelled

---

## 🔍 Verification on Blockchain

### Check Transactions on Sepolia Explorer
1. Go to: https://sepolia.etherscan.io/
2. Search for your **wallet address** or **contract address**:
   - Contract: `0x2F23CD241EeB31c87BE0822fEbEDFc9FA7459454`
3. View all invoice-related transactions

### What to Look For:
- ✅ `createInvoice` transactions from sender
- ✅ `payInvoice` transactions from recipient
- ✅ `cancelInvoice` transactions from sender
- ✅ ETH transfers matching invoice amounts
- ✅ Transaction success status

---

## 📊 Testing Checklist

### Basic Functionality
- [ ] Wallet connection works
- [ ] Network switching to Sepolia works
- [ ] Invoice creation succeeds
- [ ] Invoice appears in sent invoices
- [ ] Invoice appears in recipient's received invoices

### Payment Flow
- [ ] Recipient can view received invoices
- [ ] Payment button works
- [ ] Correct ETH amount is transferred
- [ ] Invoice status updates to "Paid"
- [ ] Both parties see updated status

### Cancellation
- [ ] Sender can cancel pending invoices
- [ ] Status updates to "Cancelled"
- [ ] Cancelled invoices cannot be paid

### Real-time Updates
- [ ] New invoices appear automatically
- [ ] Payment updates show without refresh
- [ ] Cancellation updates show without refresh

---

## ⚠️ Important Notes

### FHE Encryption Status
- **Current**: Zama FHE SDK has WASM loading issues in Replit environment
- **Impact**: Invoice amounts are stored **unencrypted** on-chain
- **Functionality**: All other features work perfectly (creation, payment, cancellation)
- **Privacy**: Consider amounts as public information until FHE is fully operational

### Gas Fees
- Invoice creation: ~0.001-0.003 ETH
- Invoice payment: ~0.0008-0.002 ETH
- Invoice cancellation: ~0.0006-0.001 ETH
- Keep at least 0.05 ETH in test wallets for multiple transactions

### Network
- Always use **Sepolia testnet** - this is a test environment
- Never send real ETH on mainnet to test addresses
- Test transactions have no real-world value

---

## 🐛 Common Issues & Solutions

### Issue: Transaction Fails
**Solutions**:
- Ensure sufficient ETH for gas fees
- Check if invoice ID is valid
- Verify correct network (Sepolia)
- Try increasing gas limit in MetaMask settings

### Issue: Invoice Not Appearing
**Solutions**:
- Wait for blockchain confirmation (30-60 seconds)
- Refresh the page
- Check transaction status on Sepolia Etherscan
- Ensure wallet is connected to correct account

### Issue: Payment Button Disabled
**Possible Reasons**:
- Invoice already paid
- Invoice cancelled
- You're viewing as sender (only recipient can pay)
- Insufficient ETH balance

### Issue: MetaMask Not Connecting
**Solutions**:
- Refresh the page
- Check if MetaMask extension is unlocked
- Clear browser cache
- Try a different browser

---

## 🎉 Success Indicators

Your dApp is working correctly if:
1. ✅ Invoices create successfully and appear on blockchain
2. ✅ Recipients can pay exact invoice amounts
3. ✅ ETH transfers complete successfully
4. ✅ Status updates reflect in real-time
5. ✅ All transactions visible on Sepolia Etherscan

---

## 📞 Testing Support

If you encounter issues during testing:
1. Check browser console for error messages (F12 → Console)
2. Verify transaction on Sepolia Etherscan
3. Ensure test ETH balance is sufficient
4. Try with a fresh browser session

## 🔗 Useful Links

- **Contract Address**: `0x2F23CD241EeB31c87BE0822fEbEDFc9FA7459454`
- **Sepolia Explorer**: https://sepolia.etherscan.io/
- **MetaMask Support**: https://support.metamask.io/
- **Sepolia Faucet**: https://sepoliafaucet.com/

---

**Happy Testing! 🚀**
