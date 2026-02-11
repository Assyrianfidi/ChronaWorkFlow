import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CompanyContextState {
  companyId: string | null;
  companyName: string | null;
  setCompany: (companyId: string, companyName?: string) => void;
  clearCompany: () => void;
}

/**
 * Company context hook for managing current company scope
 * This ensures all API calls include proper company context
 */
export const useCompanyContext = create<CompanyContextState>()(
  persist(
    (set) => ({
      companyId: null,
      companyName: null,
      
      setCompany: (companyId: string, companyName?: string) => {
        set({ companyId, companyName: companyName || null });
      },
      
      clearCompany: () => {
        set({ companyId: null, companyName: null });
      },
    }),
    {
      name: 'accubooks-company-context',
    }
  )
);

/**
 * Helper to get current company ID or throw error
 */
export function requireCompanyId(): string {
  const companyId = useCompanyContext.getState().companyId;
  if (!companyId) {
    throw new Error('Company context required but not set');
  }
  return companyId;
}
