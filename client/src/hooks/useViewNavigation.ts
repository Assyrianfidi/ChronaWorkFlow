/**
 * useViewNavigation Hook
 * Provides navigation labels that change based on current view mode (Business vs Accountant)
 */

import { useView } from "@/contexts/ViewContext";
import { MAIN_VIEWS } from "@/config/view.config";

export function useViewNavigation() {
  const { mainView, mainViewConfig } = useView();

  const getLabel = (
    key: keyof (typeof MAIN_VIEWS)["business"]["terminology"],
  ) => {
    return mainViewConfig.terminology[key];
  };

  return {
    // Main section labels
    getLabel,

    // Common labels
    sales: getLabel("sales"),
    expenses: getLabel("expenses"),
    customers: getLabel("customers"),
    vendors: getLabel("vendors"),
    reports: getLabel("reports"),
    accounting: getLabel("accounting"),
    transactions: getLabel("transactions"),
    banking: getLabel("banking"),

    // Current view info
    isBusinessView: mainView === "business",
    isAccountantView: mainView === "accountant",
    viewMode: mainView,
  };
}

export default useViewNavigation;
