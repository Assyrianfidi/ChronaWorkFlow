import { CompaniesList } from "@/components/companies/CompaniesList";

export function CompaniesPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Companies Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage company profiles, contacts, and business information
        </p>
      </div>
      <CompaniesList />
    </div>
  );
}
