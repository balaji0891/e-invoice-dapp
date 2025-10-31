# 🚀 Deployment Guide - e-Invoice dApp

## Overview
This guide will walk you through deploying your privacy-preserving invoice dApp to the Ethereum Sepolia testnet using Zama's Fully Homomorphic Encryption (FHE).

## Prerequisites

### 1. Get Sepolia Testnet ETH
- Visit [Sepolia Faucet](https://sepoliafaucet.com/) or [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- Request testnet ETH (you'll need about 0.05 ETH for deployment)

### 2. Get an RPC URL
Choose one of these providers:

**Option A: Alchemy (Recommended)**
1. Go to [Alchemy.com](https://www.alchemy.com/)
2. Sign up for a free account
3. Create a new app → Select "Ethereum" → Select "Sepolia"
4. Copy the HTTPS URL (looks like: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`)

**Option B: Infura**
1. Go to [Infura.io](https://www.infura.io/)
2. Sign up for a free account
3. Create a new project → Select "Ethereum"
4. Copy the Sepolia endpoint URL

## Step-by-Step Deployment

### Step 1: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and add your values:

```env
# Sepolia RPC URL (from Alchemy or Infura)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Your wallet private key (DO NOT SHARE THIS!)
# Export from MetaMask: Settings → Security & Privacy → Show Private Key
PRIVATE_KEY=your_private_key_here

# This will be set after deployment
VITE_CONTRACT_ADDRESS=
```

⚠️ **Security Warning:** Never commit your `.env` file to version control!

### Step 2: Compile the Smart Contract

```bash
npm run compile
```

Expected output:
```
Compiled 1 Solidity file successfully
```

### Step 3: Deploy to Sepolia

```bash
npm run deploy
```

You should see output like:
```
Deploying InvoiceManager contract to Sepolia...
Deploying with account: 0x...
Account balance: 0.05 ETH
InvoiceManager deployed to: 0x1234567890123456789012345678901234567890

Deployment complete!
Save this address in your .env file as:
VITE_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

Initial invoice count: 0
```

### Step 4: Update Environment with Contract Address

Copy the deployed contract address and update your `.env` file:

```env
VITE_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
```

### Step 5: Restart the Application

```bash
# The workflow will automatically restart
# Or manually restart with:
npm run dev
```

### Step 6: Connect Your Wallet

1. Open the application in your browser
2. Click "Connect Wallet"
3. Approve the connection in MetaMask
4. Ensure you're on Sepolia testnet (the app will prompt if not)

## Using the dApp

### Creating an Invoice

1. Click the "Create Invoice" tab
2. Fill in the form:
   - **Recipient Address**: Ethereum address (0x...)
   - **Amount**: Invoice amount in USD
   - **Description**: What the invoice is for
   - **Due Date**: Payment deadline
3. Click "Create Invoice"
4. Approve the transaction in MetaMask
5. Wait for confirmation (~15 seconds on Sepolia)

### Managing Invoices

**Sent Invoices (My Invoices tab)**
- View all invoices you've created
- Decrypt amounts (encrypted on blockchain)
- Cancel pending invoices

**Received Invoices tab**
- View invoices sent to you
- Decrypt amounts
- Mark as paid after payment

## How Privacy Works

### Zama FHE Technology

Your invoice amounts are **encrypted on the blockchain**:

1. **Client-Side Encryption**: Before sending to blockchain, amounts are encrypted using Zama's FHE
2. **On-Chain Storage**: Only encrypted values are stored publicly
3. **Authorized Decryption**: Only sender and recipient can decrypt amounts
4. **Privacy Guarantee**: Even with full blockchain visibility, amounts remain private

### Example:

```
Original Amount:  $1,250.00
Encrypted on-chain: 0xf4a8c2d9e1b7... (random-looking hex)
Who can decrypt:   Only sender & recipient
Everyone else sees: Encrypted gibberish
```

## Troubleshooting

### "Insufficient funds" error
- Get more Sepolia ETH from a faucet
- Check your balance: `npm run check-balance`

### "Invalid network" error
- Switch MetaMask to Sepolia testnet
- Network details:
  - **Network Name**: Sepolia
  - **RPC URL**: https://sepolia.infura.io/v3/YOUR_KEY
  - **Chain ID**: 11155111
  - **Currency**: SepoliaETH

### Transaction stuck/pending
- Increase gas price in MetaMask
- Wait longer (Sepolia can be slow during high usage)

### "Contract not deployed" in demo mode
- Verify `VITE_CONTRACT_ADDRESS` is set in `.env`
- Restart the development server

## Contract Verification (Optional)

To verify your contract on Etherscan:

1. Install verification plugin (already installed):
```bash
npm install --save-dev @nomicfoundation/hardhat-verify
```

2. Get Etherscan API key from [Etherscan.io](https://etherscan.io/apis)

3. Add to `.env`:
```env
ETHERSCAN_API_KEY=your_api_key_here
```

4. Verify:
```bash
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
```

## Next Steps

- Test invoice creation with a friend (exchange addresses)
- Explore encrypted amount decryption
- Try marking invoices as paid
- Check transactions on [Sepolia Etherscan](https://sepolia.etherscan.io/)

## Support

For issues with:
- **Zama SDK**: [Zama Documentation](https://docs.zama.ai/)
- **Hardhat**: [Hardhat Docs](https://hardhat.org/docs)
- **This dApp**: Check README.md or raise an issue

---

**🎉 Congratulations!** You've successfully deployed a privacy-preserving invoice system using cutting-edge FHE technology!
