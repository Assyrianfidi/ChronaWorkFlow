/**
 * Bank Reconciliation Page
 * Full-page component for bank reconciliation workflow
 */

import React, { useState } from "react";
import { BankReconciliation } from "@/components/accounting";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/hooks/useToast";
import { useView } from "@/contexts/ViewContext";
import {
  Building2,
  CreditCard,
  Wallet,
  ArrowLeftRight,
  Plus,
  Download,
  Settings,
} from "lucide-react";

const BankReconciliationPage: React.FC = () => {
  const { toast } = useToast();
  const { mainViewConfig, mainView } = useView();
  const [selectedAccount, setSelectedAccount] = useState<string>("operating");

  // Mock bank accounts - in production, fetch from API
  const bankAccounts = [
    {
      id: "operating",
      name: "Operating Account",
      bank: "Chase Bank",
      balance: 450000,
      lastReconciled: "2024-01-15",
    },
    {
      id: "savings",
      name: "Savings Account",
      bank: "Chase Bank",
      balance: 800000,
      lastReconciled: "2024-01-15",
    },
    {
      id: "payroll",
      name: "Payroll Account",
      bank: "Wells Fargo",
      balance: 125000,
      lastReconciled: "2024-01-10",
    },
  ];

  const selectedAccountData = bankAccounts.find(
    (a) => a.id === selectedAccount,
  );

  const handleExport = (format: "pdf" | "csv") => {
    toast({
      title: "Export Started",
      description: `Reconciliation report will be exported as ${format.toUpperCase()}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {mainViewConfig.terminology.reconciliation || "Bank Reconciliation"}
          </h1>
          <p className="text-muted-foreground">
            Match bank transactions with ledger entries
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("pdf")}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Bank Accounts Summary */}
      <div className="grid grid-cols-3 gap-4">
        {bankAccounts.map((account) => (
          <Card
            key={account.id}
            className={`cursor-pointer transition-all ${
              selectedAccount === account.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedAccount(account.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {account.name}
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${account.balance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {account.bank} • Last reconciled {account.lastReconciled}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Reconciliation Interface */}
      <Card className="min-h-[600px]">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>
                  {selectedAccountData?.name} Reconciliation
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedAccountData?.bank}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Unreconciled: 12</Badge>
              <Badge variant="outline">Difference: $0.00</Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Rules
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="reconcile" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="reconcile"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                Reconcile
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                Bank Transactions
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reconcile" className="p-6">
              <BankReconciliation />
            </TabsContent>

            <TabsContent value="transactions" className="p-6">
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Bank Transactions</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                  Import and manage bank feed transactions before reconciliation
                </p>
                <Button className="mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Import Bank Feed
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="p-6">
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Reconciliation History</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                  View past reconciliation sessions and reports
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankReconciliationPage;
