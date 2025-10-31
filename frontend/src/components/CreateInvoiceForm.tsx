import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CreateInvoiceData } from '../types';

interface CreateInvoiceFormProps {
  onSubmit: (data: CreateInvoiceData) => Promise<void>;
  isLoading: boolean;
}

export const CreateInvoiceForm: React.FC<CreateInvoiceFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateInvoiceData>();
  const [showForm, setShowForm] = useState(true);

  const onFormSubmit = async (data: CreateInvoiceData) => {
    console.log('🔥 CreateInvoiceForm submit fired!', data);
    try {
      await onSubmit(data);
      reset();
      setShowForm(false);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  if (!showForm) {
    return (
      <div className="text-center py-8">
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary text-lg px-8 py-3"
        >
          + Create New Invoice
        </button>
      </div>
    );
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Invoice</h2>
      
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            {...register('recipient', {
              required: 'Recipient address is required',
              pattern: {
                value: /^0x[a-fA-F0-9]{40}$/,
                message: 'Invalid Ethereum address',
              },
            })}
            className="input-field"
            placeholder="0x..."
            disabled={isLoading}
          />
          {errors.recipient && (
            <p className="text-red-600 text-sm mt-1">{errors.recipient.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            {...register('description', {
              required: 'Description is required',
              minLength: { value: 3, message: 'Description must be at least 3 characters' },
            })}
            className="input-field"
            placeholder="Enter invoice description..."
            rows={3}
            disabled={isLoading}
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (will be encrypted)
          </label>
          <input
            type="number"
            step="0.01"
            {...register('amount', {
              required: 'Amount is required',
              min: { value: 0.01, message: 'Amount must be greater than 0' },
            })}
            className="input-field"
            placeholder="0.00"
            disabled={isLoading}
          />
          {errors.amount && (
            <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            This amount will be encrypted on the blockchain
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Due Date
          </label>
          <input
            type="date"
            {...register('dueDate', {
              required: 'Due date is required',
              validate: (value) => {
                const selected = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return selected >= today || 'Due date must be in the future';
              },
            })}
            className="input-field"
            disabled={isLoading}
          />
          {errors.dueDate && (
            <p className="text-red-600 text-sm mt-1">{errors.dueDate.message}</p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex-1"
          >
            {isLoading ? 'Creating...' : 'Create Invoice'}
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              setShowForm(false);
            }}
            disabled={isLoading}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
