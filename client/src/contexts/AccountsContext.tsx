import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { accountsApi } from "../api";

// Types
export interface Account {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  parentId?: string;
  balance?: string;
  description?: string;
  isActive?: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountsState {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
  selectedCompanyId: string | null;
}

// Accounts actions
export type AccountsAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ACCOUNTS"; payload: Account[] }
  | { type: "ADD_ACCOUNT"; payload: Account }
  | {
      type: "UPDATE_ACCOUNT";
      payload: { id: string; updates: Partial<Account> };
    }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_COMPANY_ID"; payload: string };

// Initial state
const initialState: AccountsState = {
  accounts: [],
  isLoading: false,
  error: null,
  selectedCompanyId: null,
};

// Reducer
const accountsReducer = (
  state: AccountsState,
  action: AccountsAction,
): AccountsState => {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "SET_ACCOUNTS":
      return {
        ...state,
        accounts: action.payload,
        isLoading: false,
        error: null,
      };
    case "ADD_ACCOUNT":
      return {
        ...state,
        accounts: [...state.accounts, action.payload],
        isLoading: false,
        error: null,
      };
    case "UPDATE_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.map((account) =>
          account.id === action.payload.id
            ? {
                ...account,
                ...action.payload.updates,
                updatedAt: new Date().toISOString(),
              }
            : account,
        ),
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
const AccountsContext = createContext<{
  state: AccountsState;
  fetchAccounts: (companyId: string) => Promise<void>;
  createAccount: (
    accountData: Omit<Account, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  adjustBalance: (id: string, amount: number) => Promise<void>;
  clearError: () => void;
  setCompanyId: (companyId: string) => void;
} | null>(null);

// Provider
export const AccountsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(accountsReducer, initialState);

  // Fetch accounts
  const fetchAccounts = async (companyId: string): Promise<void> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await accountsApi.list(companyId);
      dispatch({ type: "SET_ACCOUNTS", payload: response.data.data });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to fetch accounts";
      dispatch({ type: "SET_ERROR", payload: message });
      throw error;
    }
  };

  // Create account
  const createAccount = async (
    accountData: Omit<Account, "id" | "createdAt" | "updatedAt">,
  ): Promise<void> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await accountsApi.create(accountData);
      dispatch({ type: "ADD_ACCOUNT", payload: response.data.data });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to create account";
      dispatch({ type: "SET_ERROR", payload: message });
      throw error;
    }
  };

  // Update account
  const updateAccount = async (
    id: string,
    updates: Partial<Account>,
  ): Promise<void> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await accountsApi.update(id, updates);
      dispatch({
        type: "UPDATE_ACCOUNT",
        payload: { id, updates: response.data.data },
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to update account";
      dispatch({ type: "SET_ERROR", payload: message });
      throw error;
    }
  };

  // Adjust balance
  const adjustBalance = async (id: string, amount: number): Promise<void> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await accountsApi.adjustBalance(id, amount);
      dispatch({
        type: "UPDATE_ACCOUNT",
        payload: { id, updates: response.data.data },
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to adjust balance";
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
    <AccountsContext.Provider
      value={{
        state,
        fetchAccounts,
        createAccount,
        updateAccount,
        adjustBalance,
        clearError,
        setCompanyId,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
};

// Hook
export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error("useAccounts must be used within an AccountsProvider");
  }
  return context;
};
