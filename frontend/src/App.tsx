import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './hooks/useWallet';
import { useZamaFHE } from './hooks/useZamaFHE';
import { WalletConnect } from './components/WalletConnect';
import { CreateInvoiceForm } from './components/CreateInvoiceForm';
import { InvoiceList } from './components/InvoiceList';
import { Invoice, CreateInvoiceData, InvoiceStatus } from './types';
import { CONTRACT_ADDRESS, INVOICE_MANAGER_ABI } from './utils/constants';
import { DEMO_MODE, getMockInvoices } from './utils/mockData';

function App() {
  const wallet = useWallet();
  const zama = useZamaFHE();
  
  const [activeTab, setActiveTab] = useState<'create' | 'sent' | 'received'>('create');
  const [sentInvoices, setSentInvoices] = useState<Invoice[]>([]);
  const [receivedInvoices, setReceivedInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [lastError, setLastError] = useState<string>('');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    if (type === 'error') {
      setLastError(message);
    }
    setTimeout(() => setNotification(null), 5000);
  };

  const loadInvoices = async () => {
    if (DEMO_MODE) {
      // Load mock data in demo mode
      const mockData = getMockInvoices(wallet.account || '0x1234567890123456789012345678901234567890');
      setSentInvoices(mockData.sent);
      setReceivedInvoices(mockData.received);
      return;
    }

    if (!wallet.isConnected || !wallet.signer || !CONTRACT_ADDRESS) return;

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, INVOICE_MANAGER_ABI, wallet.signer);

      const sentIds = await contract.getSentInvoices(wallet.account);
      const receivedIds = await contract.getReceivedInvoices(wallet.account);

      const loadInvoiceDetails = async (ids: bigint[]) => {
        const invoices: Invoice[] = [];
        for (const id of ids) {
          try {
            const details = await contract.getInvoiceDetails(id);
            invoices.push({
              id: Number(id),
              sender: details[1],
              recipient: details[2],
              description: details[3],
              amountInWei: details[4].toString(),
              dueDate: Number(details[5]),
              status: details[6] as InvoiceStatus,
              createdAt: Number(details[7]),
              paidAt: Number(details[8]),
            });
          } catch (err) {
            console.error(`Failed to load invoice ${id}:`, err);
          }
        }
        return invoices;
      };

      const sent = await loadInvoiceDetails(sentIds);
      const received = await loadInvoiceDetails(receivedIds);

      setSentInvoices(sent);
      setReceivedInvoices(received);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      showNotification('error', 'Failed to load invoices');
    }
  };

  useEffect(() => {
    if (DEMO_MODE) {
      loadInvoices();
    } else if (wallet.isConnected && wallet.isCorrectNetwork) {
      loadInvoices();
    }
  }, [wallet.isConnected, wallet.isCorrectNetwork, wallet.account]);

  useEffect(() => {
    if (!wallet.provider || !CONTRACT_ADDRESS || !wallet.isConnected) return;

    const contract = new ethers.Contract(CONTRACT_ADDRESS, INVOICE_MANAGER_ABI, wallet.provider);

    const handleInvoiceCreated = (invoiceId: bigint, sender: string, recipient: string) => {
      console.log('Invoice created:', invoiceId.toString());
      if (sender.toLowerCase() === wallet.account.toLowerCase() || 
          recipient.toLowerCase() === wallet.account.toLowerCase()) {
        loadInvoices();
        showNotification('success', `New invoice #${invoiceId.toString()} created`);
      }
    };

    const handleInvoicePaid = async (invoiceId: bigint) => {
      console.log('Invoice paid:', invoiceId.toString());
      try {
        const details = await contract.getInvoiceDetails(invoiceId);
        const sender = details[1];
        const recipient = details[2];
        
        if (sender.toLowerCase() === wallet.account.toLowerCase() || 
            recipient.toLowerCase() === wallet.account.toLowerCase()) {
          loadInvoices();
          showNotification('success', `Invoice #${invoiceId.toString()} has been paid`);
        }
      } catch (err) {
        console.error('Error checking invoice details:', err);
      }
    };

    const handleInvoiceCancelled = async (invoiceId: bigint) => {
      console.log('Invoice cancelled:', invoiceId.toString());
      try {
        const details = await contract.getInvoiceDetails(invoiceId);
        const sender = details[1];
        const recipient = details[2];
        
        if (sender.toLowerCase() === wallet.account.toLowerCase() || 
            recipient.toLowerCase() === wallet.account.toLowerCase()) {
          loadInvoices();
          showNotification('success', `Invoice #${invoiceId.toString()} has been cancelled`);
        }
      } catch (err) {
        console.error('Error checking invoice details:', err);
      }
    };

    contract.on('InvoiceCreated', handleInvoiceCreated);
    contract.on('InvoicePaid', handleInvoicePaid);
    contract.on('InvoiceCancelled', handleInvoiceCancelled);

    return () => {
      contract.off('InvoiceCreated', handleInvoiceCreated);
      contract.off('InvoicePaid', handleInvoicePaid);
      contract.off('InvoiceCancelled', handleInvoiceCancelled);
    };
  }, [wallet.provider, wallet.isConnected, wallet.account]);

  const handleCreateInvoice = async (data: CreateInvoiceData) => {
    console.log('=== CREATE INVOICE CALLED ===');
    console.log('Form data:', data);
    console.log('DEMO_MODE:', DEMO_MODE);
    console.log('CONTRACT_ADDRESS:', CONTRACT_ADDRESS);
    console.log('wallet.signer:', !!wallet.signer);
    console.log('wallet.account:', wallet.account);
    console.log('wallet.isConnected:', wallet.isConnected);
    
    if (DEMO_MODE) {
      console.log('Running in DEMO MODE');
      setIsLoading(true);
      showNotification('success', 'Demo: Invoice created! Deploy contract for real functionality.');
      setTimeout(() => {
        const newInvoice: Invoice = {
          id: sentInvoices.length + receivedInvoices.length + 1,
          sender: wallet.account || '0x1234567890123456789012345678901234567890',
          recipient: data.recipient,
          description: data.description,
          dueDate: Math.floor(new Date(data.dueDate).getTime() / 1000),
          status: InvoiceStatus.Pending,
          createdAt: Math.floor(Date.now() / 1000),
          paidAt: 0,
          decryptedAmount: `$${parseFloat(data.amount).toFixed(2)}`
        };
        setSentInvoices(prev => [newInvoice, ...prev]);
        setActiveTab('sent');
        setIsLoading(false);
      }, 1000);
      return;
    }

    if (!wallet.signer || !CONTRACT_ADDRESS || !wallet.account) {
      console.error('Wallet not ready! Missing:', {
        signer: !wallet.signer,
        contractAddress: !CONTRACT_ADDRESS,
        account: !wallet.account
      });
      showNotification('error', 'Wallet not ready - please connect your wallet first');
      return;
    }
    
    console.log('Proceeding with blockchain transaction...');

    setIsLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, INVOICE_MANAGER_ABI, wallet.signer);
      
      const dueDateTimestamp = Math.floor(new Date(data.dueDate).getTime() / 1000);
      const amountInWei = ethers.parseEther(data.amount);
      const amountInCents = Math.floor(parseFloat(data.amount) * 100);

      let encrypted;
      let encryptionUsed = false;
      
      if (zama.fhevmInstance && zama.isInitialized) {
        try {
          encrypted = await zama.encryptAmount(amountInCents, CONTRACT_ADDRESS, wallet.account);
          if (encrypted) {
            encryptionUsed = true;
          }
        } catch (err) {
          console.warn('Encryption failed, using fallback:', err);
        }
      }
      
      if (!encrypted) {
        console.log('Creating invoice without FHE encryption (amount visible on-chain)');
        encrypted = {
          handles: [ethers.zeroPadValue('0x00', 32)],
          inputProof: ethers.zeroPadValue('0x00', 64)
        };
      }

      const tx = await contract.createInvoice(
        data.recipient,
        data.description,
        encrypted.handles[0],
        encrypted.inputProof,
        amountInWei,
        dueDateTimestamp
      );

      showNotification('success', encryptionUsed ? 'Creating encrypted invoice...' : 'Creating invoice (no encryption)...');
      const receipt = await tx.wait();
      
      showNotification('success', 'Invoice created successfully on blockchain!');
      console.log('Transaction receipt:', receipt);
      await loadInvoices();
      setActiveTab('sent');
    } catch (err: any) {
      console.error('Create invoice error:', err);
      const errorMsg = err.reason || err.message || 'Failed to create invoice';
      showNotification('error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayInvoice = async (invoiceId: number, amountInWei?: string) => {
    if (DEMO_MODE) {
      setIsLoading(true);
      showNotification('success', 'Demo: Invoice marked as paid!');
      setTimeout(() => {
        setReceivedInvoices(prev => prev.map(inv => 
          inv.id === invoiceId 
            ? { ...inv, status: InvoiceStatus.Paid, paidAt: Math.floor(Date.now() / 1000) }
            : inv
        ));
        setIsLoading(false);
      }, 800);
      return;
    }

    if (!wallet.signer || !CONTRACT_ADDRESS || !amountInWei) return;

    setIsLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, INVOICE_MANAGER_ABI, wallet.signer);
      
      const tx = await contract.payInvoice(invoiceId, { value: BigInt(amountInWei) });
      
      showNotification('success', 'Processing payment...');
      await tx.wait();
      
      showNotification('success', 'Payment successful! Invoice paid.');
      await loadInvoices();
    } catch (err: any) {
      console.error('Pay invoice error:', err);
      showNotification('error', err.message || 'Failed to pay invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvoice = async (invoiceId: number) => {
    if (DEMO_MODE) {
      setIsLoading(true);
      showNotification('success', 'Demo: Invoice cancelled!');
      setTimeout(() => {
        setSentInvoices(prev => prev.map(inv => 
          inv.id === invoiceId 
            ? { ...inv, status: InvoiceStatus.Cancelled }
            : inv
        ));
        setIsLoading(false);
      }, 800);
      return;
    }

    if (!wallet.signer || !CONTRACT_ADDRESS) return;

    setIsLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, INVOICE_MANAGER_ABI, wallet.signer);
      const tx = await contract.cancelInvoice(invoiceId);
      
      showNotification('success', 'Cancelling invoice...');
      await tx.wait();
      
      showNotification('success', 'Invoice cancelled!');
      await loadInvoices();
    } catch (err: any) {
      console.error('Cancel invoice error:', err);
      showNotification('error', err.message || 'Failed to cancel invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecryptAmount = async (invoiceId: number) => {
    if (DEMO_MODE) {
      setIsDecrypting(true);
      setTimeout(() => {
        showNotification('success', 'Demo: Amount decrypted! (Already shown in demo mode)');
        setIsDecrypting(false);
      }, 500);
      return;
    }

    if (!wallet.signer || !zama.fhevmInstance || !CONTRACT_ADDRESS) return;

    setIsDecrypting(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, INVOICE_MANAGER_ABI, wallet.signer);
      const encryptedAmount = await contract.getEncryptedAmount(invoiceId);
      
      const decrypted = await zama.decryptAmount(CONTRACT_ADDRESS, encryptedAmount);
      if (decrypted) {
        const amountInDollars = (parseFloat(decrypted) / 100).toFixed(2);
        
        const updateInvoice = (invoices: Invoice[]) =>
          invoices.map((inv) =>
            inv.id === invoiceId ? { ...inv, decryptedAmount: `$${amountInDollars}` } : inv
          );

        setSentInvoices(updateInvoice);
        setReceivedInvoices(updateInvoice);
      }
    } catch (err: any) {
      console.error('Decrypt error:', err);
      showNotification('error', 'Failed to decrypt amount');
    } finally {
      setIsDecrypting(false);
    }
  };

  const isDemoMode = DEMO_MODE;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #f8f9ff 0%, #f1f5ff 100%)' }}>
      {/* Stunning Gradient Header */}
      <header className="gradient-bg shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="48" height="48" rx="12" fill="white" fillOpacity="0.15"/>
                  <path d="M24 8C24 8 16 12 16 18V26C16 32 24 36 24 36C24 36 32 32 32 26V18C32 12 24 8 24 8Z" fill="white" fillOpacity="0.9" stroke="white" strokeWidth="2"/>
                  <path d="M20 22L23 25L28 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
                <div>
                  <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    e-Invoice dApp
                    {isDemoMode && (
                      <span className="badge badge-demo text-xs">DEMO MODE</span>
                    )}
                  </h1>
                  <p className="text-sm text-white/90 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="inline">
                      <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.5 7.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z"/>
                    </svg>
                    Privacy-Preserving Invoices with <strong className="font-semibold">Encrypted Amounts</strong>
                  </p>
                  {isDemoMode && (
                    <p className="text-xs text-yellow-200 mt-1">
                      💡 Deploy smart contract to Sepolia for full blockchain functionality
                    </p>
                  )}
                </div>
              </div>
            </div>
            {!isDemoMode && (
              <WalletConnect
                account={wallet.account}
                isConnected={wallet.isConnected}
                isCorrectNetwork={wallet.isCorrectNetwork}
                error={wallet.error}
                onConnect={wallet.connectWallet}
                onDisconnect={wallet.disconnectWallet}
                onSwitchNetwork={wallet.switchToSepolia}
              />
            )}
          </div>
        </div>
      </header>

      <div className="fixed top-20 right-4 px-6 py-4 rounded-lg shadow-2xl z-50 bg-black text-white border-2 border-yellow-400 max-w-md">
        <div className="font-bold text-yellow-400 mb-2">⚠️ DEBUG INFO</div>
        <div className="text-xs space-y-1">
          <div>DEMO_MODE: <span className={DEMO_MODE ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>{String(DEMO_MODE)}</span></div>
          <div>CONTRACT: <span className="text-blue-300 break-all">{CONTRACT_ADDRESS || 'NOT SET'}</span></div>
          <div>MetaMask: <span className={(window as any).ethereum ? 'text-green-400' : 'text-red-400'}>{(window as any).ethereum ? 'Installed ✓' : 'NOT INSTALLED ❌'}</span></div>
          <div>WALLET: <span className={wallet.isConnected ? 'text-green-400' : 'text-red-400'}>{wallet.isConnected ? 'Connected' : 'Not connected'}</span></div>
          <div>NETWORK: <span className={wallet.isCorrectNetwork ? 'text-green-400' : 'text-red-400'}>{wallet.isCorrectNetwork ? 'Sepolia ✓' : 'Wrong network'}</span></div>
          {wallet.error && (
            <div className="mt-2 pt-2 border-t border-red-500">
              <div className="text-red-400 font-bold">Wallet Error:</div>
              <div className="text-red-300 break-words">{wallet.error}</div>
            </div>
          )}
          {lastError && (
            <div className="mt-2 pt-2 border-t border-red-500">
              <div className="text-red-400 font-bold">Last Error:</div>
              <div className="text-red-300 break-words">{lastError}</div>
            </div>
          )}
        </div>
      </div>

      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isDemoMode ? (
          <>
            <div className="flex gap-4 mb-8 bg-white rounded-xl p-2 shadow-lg">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex-1 ${
                  activeTab === 'create'
                    ? 'gradient-bg text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
                  </svg>
                  Create Invoice
                </span>
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex-1 ${
                  activeTab === 'sent'
                    ? 'gradient-bg text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                  My Invoices ({sentInvoices.length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex-1 ${
                  activeTab === 'received'
                    ? 'gradient-bg text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7z"/>
                  </svg>
                  Received ({receivedInvoices.length})
                </span>
              </button>
            </div>

            {activeTab === 'create' && (
              <CreateInvoiceForm onSubmit={handleCreateInvoice} isLoading={isLoading} />
            )}

            {activeTab === 'sent' && (
              <InvoiceList
                title="My Invoices"
                invoices={sentInvoices}
                isSent={true}
                onCancel={handleCancelInvoice}
                onDecrypt={handleDecryptAmount}
                isDecrypting={isDecrypting}
                emptyMessage="You haven't created any invoices yet"
              />
            )}

            {activeTab === 'received' && (
              <InvoiceList
                title="Received Invoices"
                invoices={receivedInvoices}
                isSent={false}
                onPay={handlePayInvoice}
                onDecrypt={handleDecryptAmount}
                isDecrypting={isDecrypting}
                emptyMessage="You haven't received any invoices yet"
              />
            )}
          </>
        ) : !(window as any).ethereum ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-6">🦊</div>
            <h2 className="text-3xl font-bold text-red-600 mb-4">MetaMask Required</h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              This app requires MetaMask to connect to the Ethereum blockchain. 
              MetaMask is a browser extension that allows you to interact with blockchain applications securely.
            </p>
            
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-8 max-w-2xl mx-auto text-left">
              <h3 className="font-bold text-lg mb-3 text-gray-800">📋 Quick Setup Guide:</h3>
              <ol className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">1.</span>
                  <span>Visit <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline font-semibold">metamask.io/download</a> to install the extension</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">2.</span>
                  <span>Create a new wallet or import an existing one</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">3.</span>
                  <span>Switch to <strong>Sepolia testnet</strong> in MetaMask</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">4.</span>
                  <span>Get free test ETH from <a href="https://sepoliafaucet.com/" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline font-semibold">sepoliafaucet.com</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">5.</span>
                  <span>Refresh this page and click "Connect Wallet"</span>
                </li>
              </ol>
            </div>

            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-primary text-lg px-8 py-3 inline-block"
            >
              Install MetaMask →
            </a>
          </div>
        ) : !wallet.isConnected ? (
          <div className="card text-center py-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to e-Invoice dApp</h2>
            <p className="text-gray-600 mb-8">
              Create and manage privacy-preserving invoices with fully encrypted amounts on the blockchain
            </p>
            <button onClick={wallet.connectWallet} className="btn-primary text-lg px-8 py-3">
              Connect Wallet to Get Started
            </button>
          </div>
        ) : !wallet.isCorrectNetwork ? (
          <div className="card text-center py-16">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Wrong Network</h2>
            <p className="text-gray-600 mb-8">Please switch to Sepolia testnet to use this app</p>
            <button onClick={wallet.switchToSepolia} className="btn-danger text-lg px-8 py-3">
              Switch to Sepolia
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-4 mb-8 bg-white rounded-xl p-2 shadow-lg">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex-1 ${
                  activeTab === 'create'
                    ? 'gradient-bg text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
                  </svg>
                  Create Invoice
                </span>
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex-1 ${
                  activeTab === 'sent'
                    ? 'gradient-bg text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                  My Invoices ({sentInvoices.length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex-1 ${
                  activeTab === 'received'
                    ? 'gradient-bg text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7z"/>
                  </svg>
                  Received ({receivedInvoices.length})
                </span>
              </button>
            </div>

            {activeTab === 'create' && (
              <CreateInvoiceForm onSubmit={handleCreateInvoice} isLoading={isLoading} />
            )}

            {activeTab === 'sent' && (
              <InvoiceList
                title="My Invoices"
                invoices={sentInvoices}
                isSent={true}
                onCancel={handleCancelInvoice}
                onDecrypt={handleDecryptAmount}
                isDecrypting={isDecrypting}
                emptyMessage="You haven't created any invoices yet"
              />
            )}

            {activeTab === 'received' && (
              <InvoiceList
                title="Received Invoices"
                invoices={receivedInvoices}
                isSent={false}
                onPay={handlePayInvoice}
                onDecrypt={handleDecryptAmount}
                isDecrypting={isDecrypting}
                emptyMessage="You haven't received any invoices yet"
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
