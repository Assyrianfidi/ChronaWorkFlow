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
  ariaLabel?: string;
  scrollRole?: React.AriaRole;
  contentRole?: React.AriaRole;
  itemRole?: React.AriaRole;
  itemClassName?: string;
  getItemAriaLabel?: (item: T, index: number) => string | undefined;
  renderHeader?: React.ReactNode;
  headerHeight?: number;
}

export function VirtualizedTable<T>({
  items,
  renderRow,
  estimateRowHeight = () => 50,
  className,
  itemKey = (index) => index,
  overscanCount = 5,
  ariaLabel = "Scrollable table",
  scrollRole = "region",
  contentRole,
  itemRole,
  itemClassName,
  getItemAriaLabel,
  renderHeader,
  headerHeight = 0,
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
      <div
        ref={parentRef}
        tabIndex={0}
        role={scrollRole}
        aria-label={ariaLabel}
        className="h-full w-full overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background"
      >
        <div
          role={contentRole}
          style={{
            height: `${virtualizer.getTotalSize() + headerHeight}px`,
            width: "100%",
            position: "relative",
            paddingTop: headerHeight ? `${headerHeight}px` : undefined,
          }}
        >
          {renderHeader && (
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 1,
                height: `${headerHeight}px`,
                marginTop: headerHeight ? `-${headerHeight}px` : undefined,
              }}
            >
              {renderHeader}
            </div>
          )}
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const item = items[virtualItem.index];
            if (!item) return null;
            return (
              <div
                key={virtualItem.key}
                role={itemRole}
                aria-label={getItemAriaLabel?.(item, virtualItem.index)}
                className={cn(itemClassName)}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start + headerHeight}px)`,
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

export default React.memo(VirtualizedTable) as typeof VirtualizedTable;
