export enum InvoiceStatus {
  Pending = 0,
  Paid = 1,
  Cancelled = 2,
}

export interface Invoice {
  id: number;
  sender: string;
  recipient: string;
  description: string;
  amountInWei?: string;
  dueDate: number;
  status: InvoiceStatus;
  createdAt: number;
  paidAt: number;
  decryptedAmount?: string;
}

export interface CreateInvoiceData {
  recipient: string;
  description: string;
  amount: string;
  dueDate: Date;
}
