import React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardShell } from "../../components/ui/layout/DashboardShell";

const InventoryPage: React.FC = () => {
  return (
    <DashboardShell>
      <div className="container mx-auto max-w-7xl px-6 py-6 space-y-4">
        <h1 className="text-2xl font-bold mb-4 text-default">Inventory</h1>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            {/* a11y: id + label + aria-describedby added for inventory landing search */}
            <div className="flex-1 max-w-md">
              <label htmlFor="inventory-page-search" className="sr-only">
                Search inventory
              </label>
              <input
                id="inventory-page-search"
                type="text"
                placeholder="Search inventory..."
                className="w-full px-4 py-2 border border-border-gray rounded-md bg-surface1 text-default"
                aria-describedby="inventory-page-search-help"
              />
              <p id="inventory-page-search-help" className="sr-only">
                Search inventory items by name, SKU, or other details.
              </p>
            </div>
            <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground shadow-soft">
              Add Item
            </button>
          </div>
          <div className="mt-4 rounded-xl bg-surface1 border border-border-gray p-4 shadow-soft">
            <EmptyState size="sm" title="No inventory items found" />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default InventoryPage;
