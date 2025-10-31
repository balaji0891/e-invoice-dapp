import { Invoice, InvoiceStatus } from '../types';

export const DEMO_MODE = !import.meta.env.VITE_CONTRACT_ADDRESS;

export const getMockInvoices = (userAddress: string): { sent: Invoice[], received: Invoice[] } => {
  const now = Math.floor(Date.now() / 1000);
  const oneDay = 24 * 60 * 60;
  
  const mockAddress1 = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5';
  const mockAddress2 = '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199';
  
  const sentInvoices: Invoice[] = [
    {
      id: 1,
      sender: userAddress,
      recipient: mockAddress1,
      description: 'Web Development Services - Q4 2025',
      dueDate: now + (7 * oneDay),
      status: InvoiceStatus.Pending,
      createdAt: now - (2 * oneDay),
      paidAt: 0,
      decryptedAmount: '$2,500.00'
    },
    {
      id: 2,
      sender: userAddress,
      recipient: mockAddress2,
      description: 'UI/UX Design Consultation',
      dueDate: now + (14 * oneDay),
      status: InvoiceStatus.Pending,
      createdAt: now - oneDay,
      paidAt: 0,
    },
    {
      id: 3,
      sender: userAddress,
      recipient: mockAddress1,
      description: 'Smart Contract Audit',
      dueDate: now - (3 * oneDay),
      status: InvoiceStatus.Paid,
      createdAt: now - (10 * oneDay),
      paidAt: now - (2 * oneDay),
      decryptedAmount: '$5,000.00'
    }
  ];
  
  const receivedInvoices: Invoice[] = [
    {
      id: 4,
      sender: mockAddress1,
      recipient: userAddress,
      description: 'Logo Design Services',
      dueDate: now + (5 * oneDay),
      status: InvoiceStatus.Pending,
      createdAt: now - oneDay,
      paidAt: 0,
      decryptedAmount: '$800.00'
    },
    {
      id: 5,
      sender: mockAddress2,
      recipient: userAddress,
      description: 'API Integration',
      dueDate: now + (10 * oneDay),
      status: InvoiceStatus.Pending,
      createdAt: now - (3 * oneDay),
      paidAt: 0,
    },
    {
      id: 6,
      sender: mockAddress1,
      recipient: userAddress,
      description: 'Monthly Hosting Fees',
      dueDate: now - (5 * oneDay),
      status: InvoiceStatus.Cancelled,
      createdAt: now - (15 * oneDay),
      paidAt: 0,
    }
  ];
  
  return { sent: sentInvoices, received: receivedInvoices };
};
