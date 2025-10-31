# e-Invoice dApp with Zama FHE

A decentralized application for creating privacy-preserving invoices using **Zama's Fully Homomorphic Encryption (FHE)** on Ethereum Sepolia testnet. Invoice amounts are encrypted on-chain and can only be decrypted by authorized parties (sender and recipient).

## Features

- **Privacy-Preserving**: Invoice amounts encrypted using Zama's FHE technology
- **Decentralized**: All invoice data stored on Ethereum Sepolia blockchain
- **Secure Access Control**: Only sender and recipient can decrypt invoice amounts
- **Real-time Updates**: Live status updates via on-chain events
- **MetaMask Integration**: Easy wallet connection on Sepolia testnet
- **Status Management**: Track invoices as Pending, Paid, or Cancelled

## Tech Stack

### Smart Contracts
- Solidity ^0.8.24
- Hardhat (development framework)
- @fhevm/solidity (Zama's FHE library)
- Ethers.js v6

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- @zama-fhe/relayer-sdk (FHE encryption/decryption)
- React Hook Form (form handling)

## Prerequisites

- Node.js v20 or higher
- MetaMask browser extension
- Sepolia ETH (get from [Sepolia Faucet](https://sepoliafaucet.com/))
- Alchemy or Infura API key for Sepolia RPC

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add:
- `SEPOLIA_RPC_URL`: Your Alchemy/Infura Sepolia RPC URL
- `PRIVATE_KEY`: Your wallet private key for deployment

### 3. Compile Smart Contracts

```bash
npm run compile
```

### 4. Deploy to Sepolia

Make sure you have Sepolia ETH in your deployment wallet, then:

```bash
npm run deploy
```

Save the deployed contract address and add it to `.env`:

```
VITE_CONTRACT_ADDRESS=0x...
```

### 5. Run the Application

```bash
npm run dev
```

The app will be available at http://localhost:5000

## Usage Guide

### Creating an Invoice

1. Connect your MetaMask wallet (must be on Sepolia)
2. Click "Create New Invoice"
3. Fill in:
   - Recipient's Ethereum address
   - Description of the invoice
   - Amount (will be encrypted automatically)
   - Due date
4. Click "Create Invoice"
5. Confirm the transaction in MetaMask

### Viewing Invoices

- **My Invoices**: Invoices you've created
- **Received Invoices**: Invoices sent to you

### Decrypting Amounts

Only the sender and recipient can decrypt invoice amounts:
1. Click "Decrypt Amount" on any invoice
2. The encrypted amount will be decrypted client-side using Zama SDK

### Managing Invoices

- **Recipients** can mark invoices as "Paid" (status update only - no automatic fund transfer)
- **Senders** can cancel pending invoices

**Note**: The current MVP tracks invoice status on-chain without automatic payment transfers. Recipients mark invoices as "paid" after completing off-chain payment. For production use, you can extend this to include actual ETH/token transfers with amount validation.

## Smart Contract Architecture

The `InvoiceManager` contract uses Zama's FHEVM to:
- Encrypt invoice amounts using `euint64` type
- Implement access control for encrypted data
- Track invoice status (Pending/Paid/Cancelled)
- Emit events for real-time updates

### Key Functions

- `createInvoice()`: Create new invoice with encrypted amount
- `payInvoice()`: Mark invoice as paid (recipient only)
- `cancelInvoice()`: Cancel invoice (sender only)
- `getEncryptedAmount()`: Retrieve encrypted amount (authorized users)

## Testing

Run contract tests:

```bash
npm test
```

## Security Notes

- Invoice amounts are encrypted using Zama's FHE technology
- Only sender and recipient can decrypt amounts
- Private keys should never be committed to version control
- Always use `.env` for sensitive configuration

## Zama FHE Integration

This project uses Zama's protocol for on-chain encryption:

- **Relayer URL**: `https://relayer.testnet.zama.cloud`
- **Network**: Ethereum Sepolia (Chain ID: 11155111)
- **Encryption**: Client-side using `@zama-fhe/relayer-sdk`
- **Decryption**: Via Zama's MPC gateway

## Troubleshooting

### MetaMask Issues
- Make sure you're on Sepolia testnet
- Try resetting your MetaMask account if transactions are stuck

### Decryption Fails
- Ensure you're either the sender or recipient of the invoice
- Check that Zama's relayer service is available

### Contract Deployment Fails
- Verify you have enough Sepolia ETH
- Check your RPC URL is correct
- Ensure private key is properly formatted in `.env`

## Resources

- [Zama Documentation](https://docs.zama.ai/protocol)
- [Hardhat Docs](https://hardhat.org/docs)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [MetaMask Setup](https://metamask.io/download/)

## License

MIT
