#!/bin/bash

# e-Invoice dApp - Vercel Deployment Script
# This script helps you deploy to Vercel

echo "🚀 e-Invoice dApp - Vercel Deployment"
echo "======================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI is not installed."
    echo ""
    echo "To install Vercel CLI, run:"
    echo "  npm install -g vercel"
    echo ""
    read -p "Do you want to install it now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install -g vercel
    else
        echo "❌ Cannot deploy without Vercel CLI. Exiting."
        exit 1
    fi
fi

echo "✅ Vercel CLI is installed"
echo ""

# Check if contract address is set
if [ -z "$VITE_CONTRACT_ADDRESS" ]; then
    echo "⚠️  VITE_CONTRACT_ADDRESS is not set in your environment"
    echo ""
    echo "Current contract address on Sepolia: 0x2F23CD241EeB31c87BE0822fEbEDFc9FA7459454"
    echo ""
    echo "You'll need to add this as an environment variable in Vercel after deployment."
fi

echo "📦 Building locally to test..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Fix errors before deploying."
    exit 1
fi

echo "✅ Build successful!"
echo ""

echo "🌐 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "⚠️  IMPORTANT: Don't forget to set environment variables in Vercel:"
echo "   1. Go to your project in Vercel Dashboard"
echo "   2. Navigate to Settings → Environment Variables"
echo "   3. Add: VITE_CONTRACT_ADDRESS = 0x2F23CD241EeB31c87BE0822fEbEDFc9FA7459454"
echo ""
echo "📝 For detailed instructions, see VERCEL_DEPLOYMENT.md"
