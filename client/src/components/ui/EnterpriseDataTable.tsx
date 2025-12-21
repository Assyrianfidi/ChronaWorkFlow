import * as React from "react";
import { cn } from "@/lib/utils";

import { DataTable, type Column } from "./DataTable";

type EnterpriseDataTableProps<T> = React.ComponentProps<typeof DataTable<T>>;

function EnterpriseDataTable<T>({
  className,
  ...props
}: EnterpriseDataTableProps<T>) {
  return (
    <DataTable
      {...(props as EnterpriseDataTableProps<T>)}
      className={cn("w-full", className)}
    />
  );
}

export { EnterpriseDataTable };
export type { Column, EnterpriseDataTableProps };

export default EnterpriseDataTable;
