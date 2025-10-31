#!/bin/bash

echo "🚀 e-Invoice dApp Deployment Script"
echo "===================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your configuration."
    echo "See DEPLOYMENT.md for instructions."
    exit 1
fi

# Source environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required variables
if [ -z "$SEPOLIA_RPC_URL" ]; then
    echo "❌ Error: SEPOLIA_RPC_URL not set in .env"
    exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set in .env"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Compile contracts
echo "📦 Compiling contracts..."
npm run compile
if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi
echo "✅ Contracts compiled successfully"
echo ""

# Deploy contracts
echo "🚀 Deploying to Sepolia testnet..."
npm run deploy
if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy the contract address from above"
echo "2. Add it to your .env file as VITE_CONTRACT_ADDRESS"
echo "3. Restart the development server: npm run dev"
echo ""
