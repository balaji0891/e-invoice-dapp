import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './hooks/useWallet';
import { useZamaFHE } from './hooks/useZamaFHE';
import { WalletConnect } from './components/WalletConnect';
import { CreateInvoiceForm } from './components/CreateInvoiceForm';
import { InvoiceList } from './components/InvoiceList';
import { Invoice, CreateInvoiceData, InvoiceStatus } from './types';
import { CONTRACT_ADDRESS, INVOICE_MANAGER_ABI } from './utils/constants';

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
    if (wallet.isConnected && wallet.isCorrectNetwork) {
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

  const handlePayInvoice = async (invoiceId: number) => {
    if (!wallet.signer || !CONTRACT_ADDRESS) return;

    setIsLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, INVOICE_MANAGER_ABI, wallet.signer);
      const tx = await contract.payInvoice(invoiceId);
      
      showNotification('success', 'Marking invoice as paid...');
      await tx.wait();
      
      showNotification('success', 'Invoice marked as paid!');
      await loadInvoices();
    } catch (err: any) {
      console.error('Pay invoice error:', err);
      showNotification('error', err.message || 'Failed to pay invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvoice = async (invoiceId: number) => {
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

  if (!CONTRACT_ADDRESS) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Missing</h1>
          <p className="text-gray-700">
            Please deploy the smart contract and set VITE_CONTRACT_ADDRESS in your .env file
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">e-Invoice dApp</h1>
              <p className="text-sm text-gray-600">Privacy-Preserving Invoices with Zama FHE</p>
            </div>
            <WalletConnect
              account={wallet.account}
              isConnected={wallet.isConnected}
              isCorrectNetwork={wallet.isCorrectNetwork}
              error={wallet.error}
              onConnect={wallet.connectWallet}
              onDisconnect={wallet.disconnectWallet}
              onSwitchNetwork={wallet.switchToSepolia}
            />
          </div>
        </div>
      </nav>

      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!wallet.isConnected ? (
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
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'create'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Create Invoice
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'sent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                My Invoices ({sentInvoices.length})
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'received'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Received ({receivedInvoices.length})
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
