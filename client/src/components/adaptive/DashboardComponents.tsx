import React, { useState, useEffect, useMemo, useCallback } from "react";
// @ts-ignore
import { useAdaptiveLayout } from './AdaptiveLayoutEngine.js.js';
// @ts-ignore
import { useUserExperienceMode } from './UserExperienceMode.js.js';
// @ts-ignore
import { cn } from '../../lib/utils.js.js';

// Dashboard Widget Types
export interface DashboardWidget {
  id: string;
  type: "chart" | "metric" | "table" | "list" | "calendar" | "custom";
  title: string;
  size: "small" | "medium" | "large" | "full";
  position: { x: number; y: number };
  data: any;
  config?: any;
  refreshInterval?: number;
  isDraggable?: boolean;
  isResizable?: boolean;
}

interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  columns: number;
  gap: number;
}

// Interactive Dashboard Component
export function InteractiveDashboard({
  layout,
  onLayoutChange,
  editable = false,
}: {
  layout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
  editable?: boolean;
}) {
  const { currentBreakpoint, isMobile } = useAdaptiveLayout();
  const { currentMode } = useUserExperienceMode();
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  // Adaptive columns based on breakpoint
  const adaptiveColumns = useMemo(() => {
    if (isMobile) return 1;
    if (currentBreakpoint === "tablet") return 2;
    if (currentBreakpoint === "desktop") return 3;
    return 4;
  }, [currentBreakpoint, isMobile]);

  // Sort widgets by position
  const sortedWidgets = useMemo(() => {
    return [...layout.widgets].sort((a, b) => {
      const rowA = Math.floor(a.position.y / adaptiveColumns);
      const rowB = Math.floor(b.position.y / adaptiveColumns);
      if (rowA !== rowB) return rowA - rowB;
      return a.position.x - b.position.x;
    });
  }, [layout.widgets, adaptiveColumns]);

  const handleDragStart = useCallback(
    (widgetId: string) => {
      if (!editable) return;
      setDraggedWidget(widgetId);
    },
    [editable],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetWidgetId: string) => {
      e.preventDefault();
      if (!editable || !draggedWidget || draggedWidget === targetWidgetId)
        return;

      const newWidgets = [...layout.widgets];
      const draggedIndex = newWidgets.findIndex((w) => w.id === draggedWidget);
      const targetIndex = newWidgets.findIndex((w) => w.id === targetWidgetId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [draggedWidgetObj] = newWidgets.splice(draggedIndex, 1);
        newWidgets.splice(targetIndex, 0, draggedWidgetObj);

        // Update positions
        newWidgets.forEach((widget, index) => {
          widget.position = {
            x: index % adaptiveColumns,
            y: Math.floor(index / adaptiveColumns),
          };
        });

        onLayoutChange({ ...layout, widgets: newWidgets });
      }

      setDraggedWidget(null);
    },
    [editable, draggedWidget, layout, adaptiveColumns, onLayoutChange],
  );

  const handleWidgetResize = useCallback(
    (widgetId: string, newSize: DashboardWidget["size"]) => {
      if (!editable) return;

      const newWidgets = layout.widgets.map((widget) =>
        widget.id === widgetId ? { ...widget, size: newSize } : widget,
      );

      onLayoutChange({ ...layout, widgets: newWidgets });
    },
    [editable, layout, onLayoutChange],
  );

  return (
    <div className="interactive-dashboard w-full">
      {/* Dashboard Header */}
      <div className="dashboard-header mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {layout.name}
          </h2>
          {editable && (
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                Add Widget
              </button>
              <button className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
                Reset Layout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Grid */}
      <div
        className={cn(
          "dashboard-grid grid gap-4",
          `grid-cols-${adaptiveColumns}`,
          currentMode.animations === "enhanced" &&
            "transition-all duration-300",
        )}
        style={{
          gridTemplateColumns: `repeat(${adaptiveColumns}, minmax(0, 1fr))`,
        }}
      >
        {sortedWidgets.map((widget) => (
          <DashboardWidgetComponent
            key={widget.id}
            widget={widget}
            isDraggable={editable && widget.isDraggable !== false}
            isResizable={editable && widget.isResizable !== false}
            isSelected={selectedWidget === widget.id}
            isDragged={draggedWidget === widget.id}
            onDragStart={() => handleDragStart(widget.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, widget.id)}
            onSelect={() => setSelectedWidget(widget.id)}
            onResize={(newSize) => handleWidgetResize(widget.id, newSize)}
          />
        ))}
      </div>
    </div>
  );
}

// Individual Dashboard Widget Component
function DashboardWidgetComponent({
  widget,
  isDraggable,
  isResizable,
  isSelected,
  isDragged,
  onDragStart,
  onDragOver,
  onDrop,
  onSelect,
  onResize,
}: {
  widget: DashboardWidget;
  isDraggable: boolean;
  isResizable: boolean;
  isSelected: boolean;
  isDragged: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onSelect: () => void;
  onResize: (size: DashboardWidget["size"]) => void;
}) {
  const { currentMode } = useUserExperienceMode();

  const sizeClasses = {
    small: "col-span-1 row-span-1",
    medium: "col-span-1 row-span-2",
    large: "col-span-2 row-span-2",
    full: "col-span-full row-span-2",
  };

  const renderWidgetContent = () => {
    switch (widget.type) {
      case "chart":
        return <ChartWidget data={widget.data} config={widget.config} />;
      case "metric":
        return <MetricWidget data={widget.data} config={widget.config} />;
      case "table":
        return <TableWidget data={widget.data} config={widget.config} />;
      case "list":
        return <ListWidget data={widget.data} config={widget.config} />;
      case "calendar":
        return <CalendarWidget data={widget.data} config={widget.config} />;
      default:
        return (
          <div className="p-4 text-gray-500 dark:text-gray-400">
            Custom Widget
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "dashboard-widget bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700",
        sizeClasses[widget.size],
        isDraggable && "cursor-move",
        isSelected && "ring-2 ring-blue-500",
        isDragged && "opacity-50",
        currentMode.animations === "enhanced" && "transition-all duration-200",
        "hover:shadow-lg",
      )}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onSelect}
    >
      {/* Widget Header */}
      <div className="widget-header flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {widget.title}
        </h3>
        {isResizable && (
          <select
            value={widget.size}
            onChange={(e) =>
// @ts-ignore
              onResize(e.target.value as DashboardWidget["size"])
            }
            className="text-xs p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="full">Full</option>
          </select>
        )}
      </div>

      {/* Widget Content */}
      <div className="widget-content p-4">{renderWidgetContent()}</div>
    </div>
  );
}

// Widget Type Components
function ChartWidget({ data, config }: { data: any; config?: any }) {
  return (
    <div className="chart-widget h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded">
      <div className="text-center">
        <div className="text-2xl mb-2">📊</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Chart Visualization
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {data?.type || "No data"}
        </p>
      </div>
    </div>
  );
}

function MetricWidget({ data, config }: { data: any; config?: any }) {
  const value = data?.value || 0;
  const label = data?.label || "Metric";
  const change = data?.change || 0;
  const isPositive = change >= 0;

  return (
    <div className="metric-widget">
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        {label}
      </div>
      {change !== 0 && (
        <div
          className={cn(
            "text-xs font-medium",
            isPositive
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400",
          )}
        >
          {isPositive ? "↑" : "↓"} {Math.abs(change)}%
        </div>
      )}
    </div>
  );
}

function TableWidget({ data, config }: { data: any; config?: any }) {
  const rows = data?.rows || [];
  const columns = data?.columns || [];

  return (
    <div className="table-widget overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map((col: string, index: number) => (
              <th
                key={index}
                className="text-left p-2 font-medium text-gray-900 dark:text-white"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 5).map((row: any, rowIndex: number) => (
            <tr
              key={rowIndex}
              className="border-b border-gray-100 dark:border-gray-800"
            >
              {columns.map((col: string, colIndex: number) => (
                <td
                  key={colIndex}
                  className="p-2 text-gray-600 dark:text-gray-400"
                >
                  {row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListWidget({ data, config }: { data: any; config?: any }) {
  const items = data?.items || [];

  return (
    <div className="list-widget space-y-2">
      {items.slice(0, 5).map((item: any, index: number) => (
        <div
          key={index}
          className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded"
        >
          <span className="text-sm text-gray-900 dark:text-white">
            {item.label}
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function CalendarWidget({ data, config }: { data: any; config?: any }) {
  return (
    <div className="calendar-widget h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded">
      <div className="text-center">
        <div className="text-2xl mb-2">📅</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Calendar View
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {data?.date || new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

// Dashboard Builder Component
export function DashboardBuilder() {
  const [layouts, setLayouts] = useState<DashboardLayout[]>([]);
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout | null>(
    null,
  );

  const createNewLayout = useCallback(() => {
    const newLayout: DashboardLayout = {
      id: `layout-${Date.now()}`,
      name: `New Dashboard ${layouts.length + 1}`,
      widgets: [],
      columns: 3,
      gap: 4,
    };
    setLayouts((prev) => [...prev, newLayout]);
    setCurrentLayout(newLayout);
  }, [layouts.length]);

  return (
    <div className="dashboard-builder p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Dashboard Builder
        </h2>
        <button
          onClick={createNewLayout}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create New Dashboard
        </button>
      </div>

      {currentLayout ? (
        <InteractiveDashboard
          layout={currentLayout}
          onLayoutChange={setCurrentLayout}
          editable={true}
        />
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">📊</div>
          <p>Create a new dashboard to get started</p>
        </div>
      )}
    </div>
  );
}

export default InteractiveDashboard;
