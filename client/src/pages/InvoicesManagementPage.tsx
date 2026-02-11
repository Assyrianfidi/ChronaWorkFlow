import { InvoicesList } from "@/components/invoices/InvoicesList";

export function InvoicesManagementPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Invoices Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Create and manage invoices with status tracking and payment monitoring
        </p>
      </div>
      <InvoicesList />
    </div>
  );
}
