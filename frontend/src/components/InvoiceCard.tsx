import React from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { formatAddress, formatDate, formatDueDate, getStatusColor, getStatusText, isOverdue } from '../utils/helpers';

interface InvoiceCardProps {
  invoice: Invoice;
  isSent: boolean;
  onPay?: (id: number) => void;
  onCancel?: (id: number) => void;
  onDecrypt?: (id: number) => void;
  isDecrypting?: boolean;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  isSent,
  onPay,
  onCancel,
  onDecrypt,
  isDecrypting,
}) => {
  const showOverdue = invoice.status === InvoiceStatus.Pending && isOverdue(invoice.dueDate);

  return (
    <div className="card hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Invoice #{invoice.id}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {isSent ? 'To' : 'From'}: {formatAddress(isSent ? invoice.recipient : invoice.sender)}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
          {getStatusText(invoice.status)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-gray-700">
          <span className="font-medium">Description:</span> {invoice.description}
        </p>
        
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Amount:</span>
          {invoice.decryptedAmount ? (
            <span className="text-green-600 font-semibold">{invoice.decryptedAmount}</span>
          ) : (
            <button
              onClick={() => onDecrypt?.(invoice.id)}
              disabled={isDecrypting}
              className="text-sm text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
            >
              {isDecrypting ? 'Decrypting...' : 'Decrypt Amount'}
            </button>
          )}
        </div>

        <p className="text-sm text-gray-600">
          <span className="font-medium">Due Date:</span>{' '}
          <span className={showOverdue ? 'text-red-600 font-semibold' : ''}>
            {formatDueDate(invoice.dueDate)}
            {showOverdue && ' (Overdue)'}
          </span>
        </p>

        <p className="text-sm text-gray-600">
          <span className="font-medium">Created:</span> {formatDate(invoice.createdAt)}
        </p>

        {invoice.paidAt > 0 && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Paid:</span> {formatDate(invoice.paidAt)}
          </p>
        )}
      </div>

      {invoice.status === InvoiceStatus.Pending && (
        <div className="flex gap-2 pt-4 border-t">
          {!isSent && onPay && (
            <button onClick={() => onPay(invoice.id)} className="btn-primary flex-1">
              Mark as Paid
            </button>
          )}
          {isSent && onCancel && (
            <button onClick={() => onCancel(invoice.id)} className="btn-danger flex-1">
              Cancel Invoice
            </button>
          )}
        </div>
      )}
    </div>
  );
};
