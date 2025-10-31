import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { SEPOLIA_CHAIN_ID } from '../utils/constants';

export const useWallet = () => {
  const [account, setAccount] = useState<string>('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [error, setError] = useState<string>('');

  const checkNetwork = async (prov: ethers.BrowserProvider) => {
    try {
      const network = await prov.getNetwork();
      const isCorrect = Number(network.chainId) === SEPOLIA_CHAIN_ID;
      setIsCorrectNetwork(isCorrect);
      return isCorrect;
    } catch (err) {
      console.error('Error checking network:', err);
      return false;
    }
  };

  const switchToSepolia = async () => {
    try {
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
      });
      setIsCorrectNetwork(true);
    } catch (err: any) {
      if (err.code === 4902) {
        setError('Please add Sepolia network to MetaMask');
      } else {
        setError('Failed to switch network');
      }
    }
  };

  const connectWallet = async () => {
    try {
      setError('');
      console.log('🔵 Step 1: Checking for MetaMask...');
      
      if (!window.ethereum) {
        const errorMsg = 'MetaMask is not installed. Please install MetaMask browser extension.';
        console.error('❌', errorMsg);
        setError(errorMsg);
        alert(errorMsg);
        return;
      }

      console.log('✅ MetaMask detected');
      console.log('🔵 Step 2: Requesting accounts...');

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      console.log('✅ Accounts received:', accounts);

      if (accounts.length === 0) {
        const errorMsg = 'No accounts found. Please create or unlock an account in MetaMask.';
        console.error('❌', errorMsg);
        setError(errorMsg);
        return;
      }

      console.log('🔵 Step 3: Creating provider and signer...');
      const prov = new ethers.BrowserProvider(window.ethereum);
      const sign = await prov.getSigner();
      
      console.log('✅ Provider and signer created');
      
      setProvider(prov);
      setSigner(sign);
      setAccount(accounts[0]);
      setIsConnected(true);

      console.log('🔵 Step 4: Checking network...');
      await checkNetwork(prov);
      console.log('✅ Wallet connected successfully!');
    } catch (err: any) {
      console.error('❌ Connection error:', err);
      const errorMsg = err.message || err.toString() || 'Failed to connect wallet';
      setError(errorMsg);
      alert(`Wallet Connection Error: ${errorMsg}`);
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setIsCorrectNetwork(false);
    setError('');
  };

  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return {
    account,
    provider,
    signer,
    isConnected,
    isCorrectNetwork,
    error,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
  };
};
