import { User, Invoice } from '@/types';

export const isUser = (data: unknown): data is User => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data &&
    'role' in data
  );
};

export const isInvoice = (data: unknown): data is Invoice => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'amount' in data &&
    'date' in data
  );
};
