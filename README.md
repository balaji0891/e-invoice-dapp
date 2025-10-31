# 🎨 e-Invoice dApp with Zama FHE

A beautiful, privacy-preserving decentralized application for creating invoices using **Zama's Fully Homomorphic Encryption (FHE)** on Ethereum Sepolia testnet. Invoice amounts are encrypted on-chain and can only be decrypted by authorized parties (sender and recipient).

![Zama Powered](https://img.shields.io/badge/Powered%20by-Zama%20FHE-7c3aed?style=for-the-badge)
![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-627EEA?style=for-the-badge&logo=ethereum)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)

## ✨ Features

### 🔐 Privacy & Security
- **Fully Homomorphic Encryption**: Invoice amounts encrypted using Zama's cutting-edge FHE technology
- **On-Chain Privacy**: Encrypted data stored publicly on Ethereum, but only sender/recipient can decrypt
- **Secure Access Control**: Zero-knowledge proof based authorization

### 🎯 Core Functionality
- **Create Invoices**: Send encrypted invoices to any Ethereum address
- **Track Status**: Monitor invoices as Pending, Paid, or Cancelled
- **Real-time Updates**: Live notifications via on-chain event listeners
- **Decrypt Amounts**: Authorized parties can decrypt invoice amounts client-side

### 🎨 Modern UI/UX
- **Zama-Themed Design**: Beautiful purple-blue gradient interface inspired by Zama branding
- **Responsive Layout**: Works perfectly on desktop and mobile
- **Demo Mode**: Explore full functionality without blockchain deployment
- **Smooth Animations**: Delightful micro-interactions and transitions
- **Intuitive Navigation**: Tab-based interface for easy invoice management

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

Edit `.env` and add the following:

**Required for Contract Deployment:**
- `SEPOLIA_RPC_URL`: Get a free RPC URL from [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)
  - Example: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`
- `PRIVATE_KEY`: Your wallet private key for deployment
  - **Export from MetaMask**: Click Account Details → Export Private Key
  - **⚠️ Security**: Remove the `0x` prefix if present. Never commit this to version control!

**Required for Frontend:**
- `VITE_CONTRACT_ADDRESS`: The deployed contract address (set after deployment)

### 3. Get Sepolia Testnet ETH

You need Sepolia ETH to deploy the contract and interact with it:
- Visit [Sepolia Faucet](https://sepoliafaucet.com/)
- Or use [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- Make sure your deployment wallet has at least 0.05 ETH

### 4. Compile Smart Contracts

```bash
npm run compile
```

This compiles the Solidity contracts and generates the artifacts needed for deployment.

### 5. Deploy to Sepolia

Make sure you have Sepolia ETH in your deployment wallet, then:

```bash
npm run deploy
```

After successful deployment, you'll see output like:
```
InvoiceManager deployed to: 0x1234567890abcdef...
```

**Important**: Copy this contract address and add it to your `.env` file:

```
VITE_CONTRACT_ADDRESS=0x1234567890abcdef...
```

### 6. Run the Application

```bash
npm run dev
```

The app will be available at **http://localhost:5000**

#### Demo Mode
If you haven't deployed the contract yet, the app automatically runs in **Demo Mode** with:
- 6 mock invoices (3 sent, 3 received)
- Full UI preview without blockchain interaction
- Perfect for testing the interface before deployment

#### Production Mode
Once you deploy the contract and set `VITE_CONTRACT_ADDRESS`:
- Full blockchain integration with Sepolia
- Real FHE encryption/decryption
- MetaMask wallet connection required
- Live transaction processing

Open your browser and ensure:
- MetaMask is installed
- You're connected to Sepolia testnet
- You have some Sepolia ETH for transaction gas fees

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

### Contract Not Deployed Error
**Symptom**: Frontend shows "Configuration Missing" message

**Solution**: 
1. Make sure you've deployed the contract: `npm run deploy`
2. Copy the contract address to `.env` as `VITE_CONTRACT_ADDRESS`
3. Restart the dev server: `npm run dev`

### MetaMask Issues
**Issue**: Wallet won't connect
- Make sure MetaMask is installed in your browser
- Click "Connect Wallet" and approve the connection in MetaMask

**Issue**: Wrong Network
- The app will prompt you to switch to Sepolia
- Click "Switch to Sepolia" button or manually switch in MetaMask
- Network Name: Sepolia
- Chain ID: 11155111

**Issue**: Transactions stuck
- Try resetting your MetaMask account: Settings → Advanced → Reset Account

### Decryption Fails
**Symptom**: "Failed to decrypt amount" error

**Causes**:
- You're not the sender or recipient of the invoice
- Zama's relayer service may be temporarily unavailable
- Network connectivity issues

**Solution**:
- Verify you're using the correct wallet (sender or recipient)
- Wait a few moments and try again
- Check your internet connection

### Contract Deployment Fails
**Error**: "Insufficient funds"
- Get more Sepolia ETH from a faucet
- Ensure you have at least 0.05 ETH

**Error**: "Invalid private key"
- Check that your `PRIVATE_KEY` in `.env` has no `0x` prefix
- Verify the key is 64 hexadecimal characters

**Error**: "Network error"
- Verify your `SEPOLIA_RPC_URL` is correct
- Try using a different RPC provider (Alchemy or Infura)
- Check that your API key is valid

### Zama SDK Type Errors
**Symptom**: TypeScript errors about `@zama-fhe/relayer-sdk`

**Note**: This is expected behavior. The SDK package has incomplete TypeScript definitions but works correctly at runtime. You can safely ignore these LSP/TypeScript warnings.

### Invoice Creation Fails
**Error**: "Wallet or encryption system not ready"
- Wait for the Zama encryption system to initialize (shows loading spinner)
- Ensure you're on the correct network (Sepolia)

**Error**: "Invalid Ethereum address"
- Check the recipient address is a valid format (starts with 0x, 42 characters)
- Cannot send invoice to yourself

**Error**: "Due date must be in the future"
- Select a date that's today or later

## Project Structure

```
einvoice-dapp-zama/
├── contracts/
│   ├── InvoiceManager.sol         # Main smart contract
│   ├── scripts/
│   │   └── deploy.js              # Deployment script
│   └── test/
│       └── InvoiceManager.test.js # Contract tests
├── frontend/
│   └── src/
│       ├── components/             # React components
│       │   ├── CreateInvoiceForm.tsx
│       │   ├── InvoiceCard.tsx
│       │   ├── InvoiceList.tsx
│       │   └── WalletConnect.tsx
│       ├── hooks/                  # Custom React hooks
│       │   ├── useWallet.ts       # MetaMask integration
│       │   └── useZamaFHE.ts      # Zama SDK integration
│       ├── types/                  # TypeScript types
│       ├── utils/                  # Helper functions
│       └── App.tsx                 # Main app component
├── hardhat.config.js               # Hardhat configuration
├── vite.config.ts                  # Vite configuration
├── .env.example                    # Environment template
└── package.json                    # Dependencies & scripts
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 5000 |
| `npm run build` | Build frontend for production |
| `npm run compile` | Compile smart contracts |
| `npm run deploy` | Deploy contracts to Sepolia |
| `npm test` | Run contract tests |

## Security Best Practices

### For Developers
- **Never commit `.env` file** - Contains private keys and sensitive data
- **Use separate wallets** - Don't use your main wallet for testing
- **Test on Sepolia first** - Always test on testnet before mainnet
- **Validate inputs** - The contract validates all inputs server-side

### For Users
- **Verify addresses** - Double-check recipient addresses before sending
- **Encrypted amounts** - Invoice amounts are encrypted on-chain
- **Access control** - Only sender and recipient can decrypt amounts
- **Status tracking** - All invoice status changes are recorded on-chain

## Limitations & Future Enhancements

### Current MVP Limitations
- Payment is status-only (no automatic fund transfer)
- Recipients manually mark invoices as "paid"
- No ETH/token transfer functionality built-in

### Possible Enhancements
1. **Automatic Payments**: Integrate ETH/ERC20 transfers with amount validation
2. **Dispute Resolution**: Add dispute mechanism for unpaid invoices
3. **Multi-signature**: Require multiple approvals for high-value invoices
4. **Recurring Invoices**: Support for subscription-based payments
5. **Email Notifications**: Off-chain notifications via email
6. **Invoice Templates**: Predefined invoice templates
7. **PDF Export**: Generate PDF invoices from on-chain data
8. **Analytics Dashboard**: Track payment history and statistics

## Resources

- [Zama Documentation](https://docs.zama.ai/protocol) - FHE encryption guide
- [Zama Relayer SDK](https://github.com/zama-ai/relayer-sdk) - SDK documentation
- [Hardhat Docs](https://hardhat.org/docs) - Smart contract development
- [Sepolia Faucet](https://sepoliafaucet.com/) - Get testnet ETH
- [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia) - Alternative faucet
- [MetaMask Setup](https://metamask.io/download/) - Wallet installation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
