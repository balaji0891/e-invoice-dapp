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

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
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
              dueDate: Number(details[4]),
              status: details[5] as InvoiceStatus,
              createdAt: Number(details[6]),
              paidAt: Number(details[7]),
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
    if (DEMO_MODE) {
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

    if (!wallet.signer || !zama.fhevmInstance || !CONTRACT_ADDRESS || !wallet.account) {
      showNotification('error', 'Wallet or encryption system not ready');
      return;
    }

    setIsLoading(true);
    try {
      const amountInCents = Math.floor(parseFloat(data.amount) * 100);
      
      const encrypted = await zama.encryptAmount(amountInCents, CONTRACT_ADDRESS, wallet.account);
      if (!encrypted) {
        throw new Error('Failed to encrypt amount');
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, INVOICE_MANAGER_ABI, wallet.signer);
      
      const dueDateTimestamp = Math.floor(new Date(data.dueDate).getTime() / 1000);

      const tx = await contract.createInvoice(
        data.recipient,
        data.description,
        encrypted.handles[0],
        encrypted.inputProof,
        dueDateTimestamp
      );

      showNotification('success', 'Creating invoice...');
      await tx.wait();
      
      showNotification('success', 'Invoice created successfully!');
      await loadInvoices();
      setActiveTab('sent');
    } catch (err: any) {
      console.error('Create invoice error:', err);
      showNotification('error', err.message || 'Failed to create invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayInvoice = async (invoiceId: number, amountInEth?: string) => {
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

    if (!wallet.signer || !CONTRACT_ADDRESS || !amountInEth) return;

    setIsLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, INVOICE_MANAGER_ABI, wallet.signer);
      
      const paymentValue = ethers.parseEther(amountInEth);
      
      const tx = await contract.payInvoice(invoiceId, { value: paymentValue });
      
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
      {/* Stunning Gradient Header with Zama Branding */}
      <header className="gradient-bg shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Zama Logo SVG */}
              <div className="flex items-center gap-3">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="48" height="48" rx="12" fill="white" fillOpacity="0.15"/>
                  <path d="M24 10L34 18L24 26L14 18L24 10Z" fill="white" fillOpacity="0.9"/>
                  <path d="M24 26L34 34L24 42L14 34L24 26Z" fill="white" fillOpacity="0.6"/>
                  <path d="M10 24L18 32V16L10 24Z" fill="white" fillOpacity="0.5"/>
                  <path d="M38 24L30 32V16L38 24Z" fill="white" fillOpacity="0.5"/>
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
                    Privacy-Preserving Invoices powered by <strong className="font-semibold">Zama FHE</strong>
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
        ) : !wallet.isConnected ? (
          <div className="card text-center py-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to e-Invoice dApp</h2>
            <p className="text-gray-600 mb-8">
              Create and manage privacy-preserving invoices with encrypted amounts using Zama's FHE technology
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
        ) : !zama.isInitialized ? (
          <div className="card text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing encryption system...</p>
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
