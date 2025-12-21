import React, { useRef, useEffect, useState, useCallback } from "react";
import { useAnalytics } from "./AnalyticsEngine";
import { DataVisualization, VisualizationConfig } from "./AnalyticsEngine";

interface ChartProps {
  data: any[];
  config: VisualizationConfig;
  type: "line" | "bar" | "pie" | "area" | "scatter" | "heatmap";
  width?: number;
  height?: number;
  interactive?: boolean;
  animation?: boolean;
}

// Base Chart Component
const BaseChart: React.FC<ChartProps> = ({
  data,
  config,
  type,
  width = 400,
  height = 300,
  interactive = true,
  animation = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Draw based on chart type
    switch (type) {
      case "line":
        drawLineChart(ctx, data, config, width, height);
        break;
      case "bar":
        drawBarChart(ctx, data, config, width, height);
        break;
      case "pie":
        drawPieChart(ctx, data, config, width, height);
        break;
      case "area":
        drawAreaChart(ctx, data, config, width, height);
        break;
      case "scatter":
        drawScatterChart(ctx, data, config, width, height);
        break;
      case "heatmap":
        drawHeatmap(ctx, data, config, width, height);
        break;
    }
  }, [data, config, type, width, height]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interactive || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Find closest data point
      const point = findClosestPoint(x, y, data, type, width, height);
      setHoveredPoint(point);
    },
    [interactive, data, type, width, height],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interactive || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const point = findClosestPoint(x, y, data, type, width, height);
      setSelectedPoint(point);
    },
    [interactive, data, type, width, height],
  );

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="border border-gray-200 rounded cursor-crosshair"
      />
      {hoveredPoint && (
        <div className="absolute top-0 right-0 bg-white p-2 border rounded shadow-lg text-sm">
          <div className="font-medium">{hoveredPoint.label}</div>
          <div>Value: {hoveredPoint.value}</div>
        </div>
      )}
    </div>
  );
};

// Chart drawing functions
function drawLineChart(
  ctx: CanvasRenderingContext2D,
  data: any[],
  config: VisualizationConfig,
  width: number,
  height: number,
) {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Draw axes
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  // Draw grid if enabled
  if (config.showGrid) {
    ctx.strokeStyle = "#f3f4f6";
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
  }

  // Draw line
  if (data.length > 0) {
    const xStep = chartWidth / (data.length - 1);
    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));
    const valueRange = maxValue - minValue;

    ctx.strokeStyle = config.colorScheme?.[0] || "#3b82f6";
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + xStep * index;
      const y =
        height -
        padding -
        ((point.value - minValue) / valueRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = config.colorScheme?.[0] || "#3b82f6";
    data.forEach((point, index) => {
      const x = padding + xStep * index;
      const y =
        height -
        padding -
        ((point.value - minValue) / valueRange) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

function drawBarChart(
  ctx: CanvasRenderingContext2D,
  data: any[],
  config: VisualizationConfig,
  width: number,
  height: number,
) {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Draw axes
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  if (data.length > 0) {
    const barWidth = (chartWidth / data.length) * 0.8;
    const barSpacing = (chartWidth / data.length) * 0.2;
    const maxValue = Math.max(...data.map((d) => d.value));

    data.forEach((point, index) => {
      const x = padding + (barWidth + barSpacing) * index + barSpacing / 2;
      const barHeight = (point.value / maxValue) * chartHeight;
      const y = height - padding - barHeight;

      ctx.fillStyle =
        config.colorScheme?.[index % (config.colorScheme?.length || 1)] ||
        "#3b82f6";
      ctx.fillRect(x, y, barWidth, barHeight);
    });
  }
}

function drawPieChart(
  ctx: CanvasRenderingContext2D,
  data: any[],
  config: VisualizationConfig,
  width: number,
  height: number,
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 40;

  if (data.length > 0) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = -Math.PI / 2;

    data.forEach((point, index) => {
      const sliceAngle = (point.value / total) * Math.PI * 2;

      ctx.fillStyle =
        config.colorScheme?.[index % (config.colorScheme?.length || 1)] ||
        "#3b82f6";
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        currentAngle,
        currentAngle + sliceAngle,
      );
      ctx.closePath();
      ctx.fill();

      currentAngle += sliceAngle;
    });
  }
}

function drawAreaChart(
  ctx: CanvasRenderingContext2D,
  data: any[],
  config: VisualizationConfig,
  width: number,
  height: number,
) {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Draw axes
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  if (data.length > 0) {
    const xStep = chartWidth / (data.length - 1);
    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));
    const valueRange = maxValue - minValue;

    // Draw area
    ctx.fillStyle = config.colorScheme?.[0] + "40" || "#3b82f640";
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);

    data.forEach((point, index) => {
      const x = padding + xStep * index;
      const y =
        height -
        padding -
        ((point.value - minValue) / valueRange) * chartHeight;
      ctx.lineTo(x, y);
    });

    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw line on top
    ctx.strokeStyle = config.colorScheme?.[0] || "#3b82f6";
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + xStep * index;
      const y =
        height -
        padding -
        ((point.value - minValue) / valueRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }
}

function drawScatterChart(
  ctx: CanvasRenderingContext2D,
  data: any[],
  config: VisualizationConfig,
  width: number,
  height: number,
) {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Draw axes
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  if (data.length > 0) {
    const xValues = data.map((d) => d.x || d[config.xAxis || "x"]);
    const yValues = data.map((d) => d.y || d[config.yAxis || "y"]);
    const maxX = Math.max(...xValues);
    const minX = Math.min(...xValues);
    const maxY = Math.max(...yValues);
    const minY = Math.min(...yValues);

    ctx.fillStyle = config.colorScheme?.[0] || "#3b82f6";

    data.forEach((point) => {
      const x =
        padding +
        (((point.x || point[config.xAxis || "x"]) - minX) / (maxX - minX)) *
          chartWidth;
      const y =
        height -
        padding -
        (((point.y || point[config.yAxis || "y"]) - minY) / (maxY - minY)) *
          chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  data: any[],
  config: VisualizationConfig,
  width: number,
  height: number,
) {
  // Simplified heatmap implementation
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  if (data.length > 0) {
    const rows = Math.sqrt(data.length);
    const cols = Math.ceil(data.length / rows);
    const cellWidth = chartWidth / cols;
    const cellHeight = chartHeight / rows;

    const maxValue = Math.max(
      ...data.map((d) => d.value || d[config.value || "value"]),
    );
    const minValue = Math.min(
      ...data.map((d) => d.value || d[config.value || "value"]),
    );

    data.forEach((point, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = padding + col * cellWidth;
      const y = padding + row * cellHeight;
      const value = point.value || point[config.value || "value"];

      // Color based on value
      const intensity = (value - minValue) / (maxValue - minValue);
      const hue = (1 - intensity) * 240; // Blue to red
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;

      ctx.fillRect(x, y, cellWidth, cellHeight);
    });
  }
}

function findClosestPoint(
  mouseX: number,
  mouseY: number,
  data: any[],
  type: string,
  width: number,
  height: number,
): any {
  // Simplified point finding
  if (data.length === 0) return null;

  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  if (type === "line" || type === "area") {
    const xStep = chartWidth / (data.length - 1);
    const index = Math.round((mouseX - padding) / xStep);

    if (index >= 0 && index < data.length) {
      return {
        label: data[index].label || data[index].date || `Point ${index + 1}`,
        value: data[index].value,
      };
    }
  }

  return null;
}

// Main Data Visualization Component
export const DataVisualizationComponent: React.FC<{
  visualization: DataVisualization;
  onUpdate?: (viz: DataVisualization) => void;
}> = ({ visualization, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editConfig, setEditConfig] = useState(visualization.config);

  const handleConfigUpdate = useCallback(() => {
    onUpdate?.({
      ...visualization,
      config: editConfig,
    });
    setIsEditing(false);
  }, [visualization, editConfig, onUpdate]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{visualization.title}</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">X Axis</label>
              
        <label htmlFor="input-tmhenxvd0" className="sr-only">
          Text
        </label>
        <input id="input-tmhenxvd0"
                type="text"
                value={editConfig.xAxis || ""}
                onChange={(e) =>
      
                  setEditConfig((prev: VisualizationConfig) => ({
                    ...prev,
                    xAxis: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Y Axis</label>
              
        <label htmlFor="input-fnrt03zqb" className="sr-only">
          Text
        </label>
        <input id="input-fnrt03zqb"
                type="text"
                value={editConfig.yAxis || ""}
                onChange={(e) =>
      
                  setEditConfig((prev: VisualizationConfig) => ({
                    ...prev,
                    yAxis: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              
        <label htmlFor="input-9p09cjeek" className="sr-only">
          Checkbox
        </label>
        <input id="input-9p09cjeek"
                type="checkbox"
                checked={editConfig.showLegend !== false}
                onChange={(e) =>
      
                  setEditConfig((prev: VisualizationConfig) => ({
                    ...prev,
                    showLegend: e.target.checked,
                  }))
                }
                className="mr-2"
              />
              Show Legend
            </label>
            <label className="flex items-center">
              
        <label htmlFor="input-ecpey03yr" className="sr-only">
          Checkbox
        </label>
        <input id="input-ecpey03yr"
                type="checkbox"
                checked={editConfig.showGrid !== false}
                onChange={(e) =>
      
                  setEditConfig((prev: VisualizationConfig) => ({
                    ...prev,
                    showGrid: e.target.checked,
                  }))
                }
                className="mr-2"
              />
              Show Grid
            </label>
            <label className="flex items-center">
              
        <label htmlFor="input-xhdd32r2h" className="sr-only">
          Checkbox
        </label>
        <input id="input-xhdd32r2h"
                type="checkbox"
                checked={editConfig.interactive !== false}
                onChange={(e) =>
      
                  setEditConfig((prev: VisualizationConfig) => ({
                    ...prev,
                    interactive: e.target.checked,
                  }))
                }
                className="mr-2"
              />
              Interactive
            </label>
          </div>
          <button
            onClick={handleConfigUpdate}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Save Changes
          </button>
        </div>
      ) : (
        <BaseChart
          data={visualization.data}
          config={visualization.config}
          type={visualization.type}
          width={visualization.position.width * 100}
          height={visualization.position.height * 100}
          interactive={visualization.config.interactive}
          animation={visualization.config.animation}
        />
      )}
    </div>
  );
};

// Dashboard Layout Component
export const DashboardLayout: React.FC<{
  dashboard: any;
  onVisualizationUpdate?: (viz: DataVisualization) => void;
}> = ({ dashboard, onVisualizationUpdate }) => {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  const handleDragStart = useCallback((widgetId: string) => {
    setDraggedWidget(widgetId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetWidgetId: string) => {
      e.preventDefault();
      // Handle widget reordering
    },
    [],
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{dashboard.name}</h2>
        <p className="text-gray-600">
          Last updated: {new Date(dashboard.lastUpdated).toLocaleString()}
        </p>
      </div>

      <div
        className={`grid gap-6 ${
          dashboard.layout === "grid"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : dashboard.layout === "flex"
              ? "flex flex-wrap"
              : "grid-cols-1"
        }`}
      >
        {dashboard.widgets.map((widget: DataVisualization) => (
          <div
            key={widget.id}
            draggable
            onDragStart={() => handleDragStart(widget.id)}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, widget.id)}
            className={`${dashboard.layout === "custom" ? "absolute" : ""} ${
              draggedWidget === widget.id ? "opacity-50" : ""
            }`}
            style={
              dashboard.layout === "custom"
                ? {
                    left: widget.position.x * 100,
                    top: widget.position.y * 100,
                    width: widget.position.width * 100,
                    height: widget.position.height * 100,
                  }
                : {}
            }
          >
            <DataVisualizationComponent
              visualization={widget}
              onUpdate={onVisualizationUpdate}
            />
          </div>
        ))}
      </div>

      {dashboard.widgets.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-lg font-medium">No widgets added</div>
          <div>Add visualizations to build your dashboard</div>
        </div>
      )}
    </div>
  );
};

export default DataVisualizationComponent;
