import React from 'react';
import { Invoice } from '../types';
import { InvoiceCard } from './InvoiceCard';

interface InvoiceListProps {
  title: string;
  invoices: Invoice[];
  isSent: boolean;
  onPay?: (id: number) => void;
  onCancel?: (id: number) => void;
  onDecrypt?: (id: number) => void;
  isDecrypting?: boolean;
  emptyMessage?: string;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  title,
  invoices,
  isSent,
  onPay,
  onCancel,
  onDecrypt,
  isDecrypting,
  emptyMessage = 'No invoices found',
}) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      
      {invoices.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {invoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              isSent={isSent}
              onPay={onPay}
              onCancel={onCancel}
              onDecrypt={onDecrypt}
              isDecrypting={isDecrypting}
            />
          ))}
        </div>
      )}
    </div>
  );
};
