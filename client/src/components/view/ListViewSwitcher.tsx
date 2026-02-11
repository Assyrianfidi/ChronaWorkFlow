/**
 * ListViewSwitcher Component
 * Switch between Compact, Expanded, Grid, and Card list views
 */

import React from "react";
import { useView } from "@/contexts/ViewContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { AlignJustify, List, Table, LayoutGrid } from "lucide-react";
import { LIST_VIEWS } from "@/config/view.config";

export const ListViewSwitcher: React.FC = () => {
  const { listView, setListView } = useView();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "AlignJustify":
        return AlignJustify;
      case "List":
        return List;
      case "Table":
        return Table;
      case "LayoutGrid":
        return LayoutGrid;
      default:
        return List;
    }
  };

  return (
    <div className="flex items-center gap-1 border rounded-md p-1">
      {Object.values(LIST_VIEWS).map((view) => {
        const Icon = getIcon(view.icon);
        const isActive = listView === view.id;

        return (
          <Button
            key={view.id}
            variant={isActive ? "secondary" : "ghost"}
            size="icon"
            className={cn("h-7 w-7", isActive && "bg-secondary")}
            onClick={() => setListView(view.id)}
            title={`${view.name} - ${view.description}`}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
};

export default ListViewSwitcher;
