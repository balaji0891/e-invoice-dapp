import React from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { formatAddress, formatDate, formatDueDate, getStatusText, isOverdue } from '../utils/helpers';

interface InvoiceCardProps {
  invoice: Invoice;
  isSent: boolean;
  onPay?: (id: number) => void;
  onCancel?: (id: number) => void;
  onDecrypt?: (id: number) => void;
  isDecrypting?: boolean;
}

const getStatusBadgeClass = (status: InvoiceStatus): string => {
  switch (status) {
    case InvoiceStatus.Pending:
      return 'badge-pending';
    case InvoiceStatus.Paid:
      return 'badge-paid';
    case InvoiceStatus.Cancelled:
      return 'badge-cancelled';
    default:
      return 'badge-pending';
  }
};

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
    <div className="card hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center text-white font-bold">
              #{invoice.id}
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              Invoice #{invoice.id}
            </h3>
          </div>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="inline">
              <path d="M7 0a7 7 0 100 14A7 7 0 007 0zm0 12.25a5.25 5.25 0 110-10.5 5.25 5.25 0 010 10.5z"/>
            </svg>
            {isSent ? 'To' : 'From'}: <span className="font-semibold">{formatAddress(isSent ? invoice.recipient : invoice.sender)}</span>
          </p>
        </div>
        <span className={`badge ${getStatusBadgeClass(invoice.status)}`}>
          {getStatusText(invoice.status)}
        </span>
      </div>

      <div className="space-y-3 mb-4 bg-gray-50 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" className="mt-0.5 text-gray-600">
            <path d="M9 0a9 9 0 100 18A9 9 0 009 0zm1 13H8v-2h2v2zm0-3H8V5h2v5z"/>
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">Description</p>
            <p className="text-gray-900 font-medium">{invoice.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white rounded-lg p-3 border-2 border-purple-100">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-purple-600">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.169-.36.264-.521z"/>
          </svg>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500">Encrypted Amount</p>
            {invoice.decryptedAmount ? (
              <span className="text-2xl font-bold text-purple-700">{invoice.decryptedAmount}</span>
            ) : (
              <button
                onClick={() => onDecrypt?.(invoice.id)}
                disabled={isDecrypting}
                className="text-sm font-semibold text-purple-600 hover:text-purple-700 underline disabled:opacity-50 flex items-center gap-1"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M7 3.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM2 7a5 5 0 1110 0A5 5 0 012 7z"/>
                </svg>
                {isDecrypting ? 'Decrypting...' : 'Click to Decrypt'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 font-medium">Due Date</p>
            <p className={`font-semibold ${showOverdue ? 'text-red-600' : 'text-gray-900'}`}>
              {formatDueDate(invoice.dueDate)}
              {showOverdue && ' ⚠️'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Created</p>
            <p className="text-gray-900 font-semibold">{formatDate(invoice.createdAt)}</p>
          </div>
        </div>

        {invoice.paidAt > 0 && (
          <div className="bg-green-50 rounded-lg p-2 border border-green-200">
            <p className="text-sm text-green-800">
              <span className="font-semibold">✓ Paid:</span> {formatDate(invoice.paidAt)}
            </p>
          </div>
        )}
      </div>

      {invoice.status === InvoiceStatus.Pending && (
        <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
          {!isSent && onPay && (
            <button onClick={() => onPay(invoice.id)} className="btn-success flex-1">
              <span className="flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                  <path d="M16 0H2C.9 0 0 .9 0 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2zM7 14L2 9l1.41-1.41L7 11.17l7.59-7.59L16 5l-9 9z"/>
                </svg>
                Mark as Paid
              </span>
            </button>
          )}
          {isSent && onCancel && (
            <button onClick={() => onCancel(invoice.id)} className="btn-danger flex-1">
              <span className="flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                  <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"/>
                </svg>
                Cancel Invoice
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
