import { TransactionsList } from "@/components/transactions/TransactionsList";

export function TransactionsManagementPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Transactions Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Track income, expenses, and transfers with date range filtering
        </p>
      </div>
      <TransactionsList />
    </div>
  );
}
