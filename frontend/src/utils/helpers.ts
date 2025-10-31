import { format } from 'date-fns';
import { InvoiceStatus } from '../types';

export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatDate = (timestamp: number): string => {
  if (!timestamp) return 'N/A';
  return format(new Date(timestamp * 1000), 'MMM dd, yyyy HH:mm');
};

export const formatDueDate = (timestamp: number): string => {
  if (!timestamp) return 'N/A';
  return format(new Date(timestamp * 1000), 'MMM dd, yyyy');
};

export const getStatusColor = (status: InvoiceStatus): string => {
  switch (status) {
    case InvoiceStatus.Pending:
      return 'text-yellow-600 bg-yellow-100';
    case InvoiceStatus.Paid:
      return 'text-green-600 bg-green-100';
    case InvoiceStatus.Cancelled:
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getStatusText = (status: InvoiceStatus): string => {
  switch (status) {
    case InvoiceStatus.Pending:
      return 'Pending';
    case InvoiceStatus.Paid:
      return 'Paid';
    case InvoiceStatus.Cancelled:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

export const isOverdue = (dueDate: number): boolean => {
  if (!dueDate) return false;
  return Date.now() > dueDate * 1000;
};
