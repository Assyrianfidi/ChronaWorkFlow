import React from "react";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
  ArrowRight,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Shield,
} from "lucide-react";

interface PriorityItem {
  id: string;
  title: string;
  subtitle: string;
  priority: "critical" | "high" | "medium" | "low";
  type: "financial" | "operational" | "people" | "security" | "opportunity";
  timeEstimate?: string;
  autoResolve?: boolean;
}

interface PriorityStackProps {
  items: PriorityItem[];
  onItemClick: (itemId: string) => void;
  onDismiss: (itemId: string) => void;
  onResolve: (itemId: string) => void;
}

const defaultItems: PriorityItem[] = [
  {
    id: "p1",
    title: "Approve Q1 budget increase",
    subtitle: "$45K requested by Operations",
    priority: "critical",
    type: "financial",
    timeEstimate: "2 min",
    autoResolve: false,
  },
  {
    id: "p2",
    title: "3 invoices need approval",
    subtitle: "$12,450 total, all verified",
    priority: "high",
    type: "operational",
    timeEstimate: "1 min",
    autoResolve: true,
  },
  {
    id: "p3",
    title: "Team lead promotion pending",
    subtitle: "Sarah Chen - Engineering",
    priority: "medium",
    type: "people",
    timeEstimate: "5 min",
    autoResolve: false,
  },
  {
    id: "p4",
    title: "Security audit complete",
    subtitle: "Review findings before EOD",
    priority: "medium",
    type: "security",
    timeEstimate: "10 min",
    autoResolve: false,
  },
  {
    id: "p5",
    title: "New partnership opportunity",
    subtitle: "TechCorp - $200K potential",
    priority: "low",
    type: "opportunity",
    timeEstimate: "15 min",
    autoResolve: false,
  },
];

const priorityConfig = {
  critical: {
    number: "1",
    border: "border-rose-500/60",
    bg: "bg-rose-500/15",
    icon: "text-rose-400",
    glow: "shadow-rose-500/20",
  },
  high: {
    number: "2",
    border: "border-orange-500/50",
    bg: "bg-orange-500/10",
    icon: "text-orange-400",
    glow: "shadow-orange-500/20",
  },
  medium: {
    number: "3",
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    icon: "text-amber-400",
    glow: "shadow-amber-500/15",
  },
  low: {
    number: "4",
    border: "border-blue-500/40",
    bg: "bg-blue-500/10",
    icon: "text-blue-400",
    glow: "shadow-blue-500/15",
  },
};

const typeIcons = {
  financial: <DollarSign className="w-4 h-4" />,
  operational: <Clock className="w-4 h-4" />,
  people: <Users className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  opportunity: <TrendingUp className="w-4 h-4" />,
};

export const PriorityStack: React.FC<PriorityStackProps> = ({
  items = defaultItems,
  onItemClick,
  onDismiss,
  onResolve,
}) => {
  const sortedItems = [...items].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            Priority Stack
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-slate-400">
            AI-ranked
          </span>
        </div>
        <span className="text-xs text-slate-500">{items.length} items</span>
      </div>

      <div className="space-y-2">
        {sortedItems.map((item, index) => {
          const config = priorityConfig[item.priority];
          const isFirst = index === 0;

          return (
            <div
              key={item.id}
              className={cn(
                "group relative p-3 rounded-xl backdrop-blur-md border transition-all duration-300",
                "hover:scale-[1.02] cursor-pointer",
                config.border,
                config.bg,
                config.glow,
                isFirst && "ring-1 ring-rose-500/30",
              )}
              onClick={() => onItemClick(item.id)}
            >
              <div className="flex items-start gap-3">
                {/* Rank Number */}
                <div
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    item.priority === "critical"
                      ? "bg-rose-500 text-white"
                      : item.priority === "high"
                        ? "bg-orange-500 text-white"
                        : item.priority === "medium"
                          ? "bg-amber-500 text-slate-900"
                          : "bg-blue-500 text-white",
                  )}
                >
                  {config.number}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn("text-slate-300", config.icon)}>
                      {typeIcons[item.type]}
                    </span>
                    <span className="text-sm font-medium text-slate-200 truncate">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{item.subtitle}</p>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      {item.timeEstimate && (
                        <span className="text-xs text-slate-500">
                          ~{item.timeEstimate}
                        </span>
                      )}
                      {item.autoResolve && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">
                          Auto-resolve
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onResolve(item.id);
                      }}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200",
                        "opacity-0 group-hover:opacity-100",
                        item.priority === "critical"
                          ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                          : item.priority === "high"
                            ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                            : item.priority === "medium"
                              ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                              : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
                      )}
                    >
                      Resolve
                      <CheckCircle2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(item.id);
                  }}
                  className="flex-shrink-0 p-1 rounded-md text-slate-600 hover:text-slate-400 hover:bg-slate-800/50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Priority Indicator Line */}
              <div
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-r",
                  item.priority === "critical"
                    ? "bg-rose-500"
                    : item.priority === "high"
                      ? "bg-orange-500"
                      : item.priority === "medium"
                        ? "bg-amber-500"
                        : "bg-blue-500",
                )}
              />
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="p-8 text-center rounded-xl bg-slate-900/50 border border-slate-800">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">All caught up</p>
          <p className="text-xs text-slate-600">No items requiring attention</p>
        </div>
      )}
    </div>
  );
};

export default PriorityStack;
