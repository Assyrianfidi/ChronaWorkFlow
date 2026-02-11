/**
 * TransactionViewSwitcher Component
 * Switch between Classic, Simplified, and Split transaction views
 */

import React from "react";
import { useView } from "@/contexts/ViewContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormInput, Minimize2, Columns, Check } from "lucide-react";
import { TRANSACTION_VIEWS } from "@/config/view.config";

export const TransactionViewSwitcher: React.FC = () => {
  const { transactionView, setTransactionView, transactionViewConfig } =
    useView();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "FormInput":
        return FormInput;
      case "Minimize2":
        return Minimize2;
      case "Columns":
        return Columns;
      default:
        return FormInput;
    }
  };

  const CurrentIcon = getIcon(transactionViewConfig.icon);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{transactionViewConfig.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {Object.values(TRANSACTION_VIEWS).map((view) => {
          const Icon = getIcon(view.icon);
          const isActive = transactionView === view.id;

          return (
            <DropdownMenuItem
              key={view.id}
              onClick={() => setTransactionView(view.id)}
              className={cn(
                "flex items-center justify-between",
                isActive && "bg-primary/10",
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{view.name}</span>
              </div>
              {isActive && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TransactionViewSwitcher;
