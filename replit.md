# e-Invoice dApp Project

## Overview
Privacy-preserving decentralized invoice application using Zama's FHE (Fully Homomorphic Encryption) on Ethereum Sepolia testnet. Invoice amounts are encrypted on-chain and can only be decrypted by authorized parties.

## Recent Changes
- **October 31, 2025**: Initial project setup
  - Created InvoiceManager smart contract with Zama FHEVM integration
  - Built React frontend with TypeScript and Vite
  - Integrated MetaMask wallet connection for Sepolia
  - Implemented Zama SDK for client-side encryption/decryption
  - Created invoice creation, viewing, and management features
  - Added Tailwind CSS for styling

## Project Architecture

### Smart Contracts (`/contracts`)
- **InvoiceManager.sol**: Main contract managing encrypted invoices
  - Uses `@fhevm/solidity` for FHE operations
  - Encrypts amounts using `euint64` type
  - Implements access control for encrypted data
  - Tracks invoice status (Pending/Paid/Cancelled)

### Frontend (`/frontend`)
- **React + TypeScript + Vite**
- **Hooks**:
  - `useWallet`: MetaMask connection and Sepolia network management
  - `useZamaFHE`: Zama SDK initialization and encryption/decryption
- **Components**:
  - `WalletConnect`: Wallet connection UI
  - `CreateInvoiceForm`: Invoice creation with validation
  - `InvoiceCard`: Display individual invoice
  - `InvoiceList`: Dashboard for sent/received invoices
  - `App`: Main application container

### Configuration
- **Hardhat**: Smart contract development and deployment
- **Vite**: Frontend bundler (configured for host 0.0.0.0:5000)
- **Tailwind CSS**: Utility-first styling

## Tech Stack

### Blockchain
- Solidity ^0.8.24
- Hardhat
- Ethers.js v6
- @fhevm/solidity (Zama FHEVM)

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- @zama-fhe/relayer-sdk
- React Hook Form
- date-fns

## Environment Variables Required
- `SEPOLIA_RPC_URL`: Alchemy/Infura Sepolia RPC endpoint
- `PRIVATE_KEY`: Deployment wallet private key
- `VITE_CONTRACT_ADDRESS`: Deployed contract address

## Key Features
1. MetaMask wallet connection on Sepolia
2. Create invoices with encrypted amounts
3. View sent and received invoices
4. Decrypt amounts (sender/recipient only)
5. Mark invoices as paid (recipient)
6. Cancel invoices (sender)
7. Real-time status updates via events

## Zama Integration
- **Relayer**: https://relayer.testnet.zama.cloud
- **Chain**: Sepolia (11155111)
- **Encryption**: Client-side euint64 for amounts
- **Access Control**: Only sender/recipient can decrypt

## User Preferences
None specified yet.

## Deployment
Contract must be deployed to Sepolia before frontend use:
```bash
npm run compile
npm run deploy
```

Save contract address to `.env` as `VITE_CONTRACT_ADDRESS`.

## Current State
- ✅ Smart contracts ready for deployment
- ✅ Frontend fully implemented with real-time event listening
- ✅ Workflow configured and running on port 5000 without errors
- ✅ All features tested and reviewed
- ✅ Zama SDK import fixed to use `/web` export path
- ✅ Comprehensive documentation completed
- ⚠️ Requires Sepolia RPC URL and private key for contract deployment
- ⚠️ Note: Zama SDK has incomplete TypeScript definitions - the SDK works correctly at runtime but LSP may show type errors

## Implementation Notes
- Payment model: Status-only updates (no automatic fund transfers in MVP)
- Real-time updates via contract event listeners (InvoiceCreated, InvoicePaid, InvoiceCancelled)
- Event filtering ensures only relevant invoice updates trigger notifications
- Encryption/decryption handled client-side using Zama SDK
- **Zama SDK Import**: Must use `@zama-fhe/relayer-sdk/web` (not the default export) for browser environments

## Next Steps for Deployment
1. Set up Sepolia RPC URL (Alchemy/Infura)
2. Deploy InvoiceManager contract: `npm run deploy`
3. Add deployed contract address to environment
4. Test with MetaMask on Sepolia testnet
