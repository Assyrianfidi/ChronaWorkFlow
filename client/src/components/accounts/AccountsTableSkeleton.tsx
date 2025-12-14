import React from "react";
import { Skeleton } from '../components/ui/skeleton.js';

interface AccountsTableSkeletonProps {
  rowCount?: number;
  showHeader?: boolean;
}

export const AccountsTableSkeleton: React.FC<AccountsTableSkeletonProps> = ({
  rowCount = 10,
  showHeader = true,
}) => {
  return (
    <div className="space-y-2">
      {showHeader && (
        <div className="flex items-center justify-between space-x-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}

      <div className="rounded-md border">
        <div className="grid grid-cols-12 gap-4 p-4 border-b">
          <Skeleton className="h-4 w-24 col-span-2" />
          <Skeleton className="h-4 w-48 col-span-4" />
          <Skeleton className="h-4 w-20 col-span-2" />
          <Skeleton className="h-4 w-24 col-span-2 ml-auto" />
        </div>

        <div className="p-2 space-y-2">
          {Array.from({ length: rowCount }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-4 p-2 hover:bg-muted/50"
            >
              <div className="flex items-center space-x-2 col-span-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 col-span-4" />
              <Skeleton className="h-4 col-span-2" />
              <Skeleton className="h-4 col-span-2 ml-auto w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(AccountsTableSkeleton);
