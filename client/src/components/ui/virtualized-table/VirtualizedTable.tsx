import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

export interface VirtualizedTableProps<T> {
  items: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  estimateRowHeight?: (index: number) => number;
  className?: string;
  itemKey?: (index: number, data: T) => string | number;
  overscanCount?: number;
}

export function VirtualizedTable<T>({
  items,
  renderRow,
  estimateRowHeight = () => 50,
  className,
  itemKey = (index) => index,
  overscanCount = 5,
}: VirtualizedTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowHeights = React.useMemo(
    () => items.map((_, index) => estimateRowHeight(index)),
    [items, estimateRowHeight],
  );

  const getItemSize = React.useCallback(
    (index: number) => rowHeights[index] || 50,
    [rowHeights],
  );

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: getItemSize,
    overscan: overscanCount,
    getItemKey: React.useCallback(
      (index: number) => {
        return itemKey(index, items[index]);
      },
      [items, itemKey],
    ),
  });

  return (
    <div className={cn("w-full h-full", className)}>
      <div ref={parentRef} className="h-full w-full overflow-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const item = items[virtualItem.index];
            if (!item) return null;
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {renderRow(item, virtualItem.index)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// @ts-ignore
export default React.memo(VirtualizedTable) as typeof VirtualizedTable;
