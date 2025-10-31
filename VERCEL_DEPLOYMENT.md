# Deploying e-Invoice dApp to Vercel

This guide will walk you through deploying the e-Invoice dApp to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket
3. **Smart Contract Deployed**: Ensure your contract is deployed to Sepolia testnet

## Step 1: Prepare Your Repository

Make sure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Import Project to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your repository
4. Vercel will auto-detect the framework (Vite)

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

## Step 3: Configure Build Settings

Vercel should auto-detect these settings from `vercel.json`, but verify:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Step 4: Set Environment Variables

⚠️ **CRITICAL**: Add these environment variables in Vercel project settings:

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `VITE_CONTRACT_ADDRESS` | `0x2F23CD241EeB31c87BE0822fEbEDFc9FA7459454` | Your deployed contract address on Sepolia |

**Note**: You do NOT need to add `PRIVATE_KEY` or `SEPOLIA_RPC_URL` for the frontend deployment. These are only needed for contract deployment on your local machine.

## Step 5: Deploy

1. Click **"Deploy"** button
2. Wait for the build to complete (2-3 minutes)
3. Vercel will provide you with a production URL like:
   - `https://your-app.vercel.app`

## Step 6: Test Your Deployment

1. Visit your Vercel URL
2. You should see the "MetaMask Required" screen if MetaMask is not installed
3. Install MetaMask and connect to **Sepolia testnet**
4. Get test ETH from [sepoliafaucet.com](https://sepoliafaucet.com/)
5. Connect your wallet
6. Create test invoices!

## Automatic Deployments

Vercel automatically deploys when you push to your Git repository:

- **Production**: Pushes to `main` branch → Production URL
- **Preview**: Pushes to other branches → Preview URLs

## Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed by Vercel

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript has no errors: `npm run build` locally

### MetaMask Not Connecting

- Ensure you're on Sepolia testnet in MetaMask
- Check browser console for errors
- Verify contract address is correct in environment variables

### Contract Interactions Fail

- Verify `VITE_CONTRACT_ADDRESS` is set correctly
- Ensure contract is deployed to Sepolia
- Check you have test ETH in your wallet
- Verify you're on the correct network (Sepolia)

### WASM Loading Issues

The app may show WASM-related errors in the console. This is expected and doesn't affect core functionality. The app works without FHE encryption in production environments.

## Production Checklist

- ✅ Contract deployed to Sepolia
- ✅ `VITE_CONTRACT_ADDRESS` environment variable set
- ✅ Build completes successfully
- ✅ MetaMask detection works
- ✅ Wallet connection works
- ✅ Invoice creation works
- ✅ Payment functionality works

## Support

If you encounter issues:

1. Check Vercel build logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Test locally first: `npm run build && npm run preview`

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [MetaMask Documentation](https://docs.metamask.io/)
- [Sepolia Faucet](https://sepoliafaucet.com/)
