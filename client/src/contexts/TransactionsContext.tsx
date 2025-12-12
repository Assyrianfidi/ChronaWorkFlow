import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { transactionsApi } from '../api.js';

// Types
export interface TransactionLine {
  id: string;
  transactionId: string;
  accountId: string;
  debit: string;
  credit: string;
  description?: string;
}

export interface Transaction {
  id: string;
  companyId: string;
  transactionNumber: string;
  date: string;
  type: "journal_entry" | "invoice" | "payment" | "bank";
  totalAmount: string;
  description?: string;
  referenceNumber?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lines?: TransactionLine[];
}

export interface TransactionsState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  selectedCompanyId: string | null;
}

// Transactions actions
export type TransactionsAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_TRANSACTIONS"; payload: Transaction[] }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_COMPANY_ID"; payload: string };

// Initial state
const initialState: TransactionsState = {
  transactions: [],
  isLoading: false,
  error: null,
  selectedCompanyId: null,
};

// Reducer
const transactionsReducer = (
  state: TransactionsState,
  action: TransactionsAction,
): TransactionsState => {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "SET_TRANSACTIONS":
      return {
        ...state,
        transactions: action.payload,
        isLoading: false,
        error: null,
      };
    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
        isLoading: false,
        error: null,
      };
    case "SET_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "SET_COMPANY_ID":
      return {
        ...state,
        selectedCompanyId: action.payload,
      };
    default:
      return state;
  }
};

// Context
const TransactionsContext = createContext<{
  state: TransactionsState;
  fetchTransactions: (companyId: string) => Promise<void>;
  createTransaction: (
    transactionData: Omit<
      Transaction,
      "id" | "createdBy" | "createdAt" | "updatedAt"
    > & { lines: TransactionLine[] },
  ) => Promise<void>;
  clearError: () => void;
  setCompanyId: (companyId: string) => void;
} | null>(null);

// Provider
// @ts-ignore
export const TransactionsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(transactionsReducer, initialState);

  // Fetch transactions
  const fetchTransactions = async (companyId: string): Promise<void> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await transactionsApi.list(companyId);
      dispatch({ type: "SET_TRANSACTIONS", payload: response.data.data });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to fetch transactions";
      dispatch({ type: "SET_ERROR", payload: message });
      throw error;
    }
  };

  // Create transaction
  const createTransaction = async (
    transactionData: Omit<
      Transaction,
      "id" | "createdBy" | "createdAt" | "updatedAt"
    > & { lines: TransactionLine[] },
  ): Promise<void> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await transactionsApi.create(transactionData);
      dispatch({ type: "ADD_TRANSACTION", payload: response.data.data });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to create transaction";
      dispatch({ type: "SET_ERROR", payload: message });
      throw error;
    }
  };

  // Clear error
  const clearError = (): void => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // Set company ID
  const setCompanyId = (companyId: string): void => {
    dispatch({ type: "SET_COMPANY_ID", payload: companyId });
  };

  return (
    <TransactionsContext.Provider
      value={{
        state,
        fetchTransactions,
        createTransaction,
        clearError,
        setCompanyId,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
};

// Hook
export const useTransactions = () => {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error(
      "useTransactions must be used within a TransactionsProvider",
    );
  }
  return context;
};
