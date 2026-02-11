/**
 * ReportViewModeSwitcher Component
 * Switch between Standard, Print, Email, and PDF report layouts
 */

import React from "react";
import { useView } from "@/contexts/ViewContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Monitor,
  Printer,
  Mail,
  FileText,
  Check,
  Download,
} from "lucide-react";
import { REPORT_VIEWS } from "@/config/view.config";

export const ReportViewModeSwitcher: React.FC<{
  onExport?: (mode: string) => void;
}> = ({ onExport }) => {
  const { reportView, setReportView, reportViewConfig } = useView();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Monitor":
        return Monitor;
      case "Printer":
        return Printer;
      case "Mail":
        return Mail;
      case "FileText":
        return FileText;
      default:
        return Monitor;
    }
  };

  const CurrentIcon = getIcon(reportViewConfig.icon);

  const handleModeChange = (modeId: string) => {
    setReportView(modeId as any);
    if (onExport) {
      onExport(modeId);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CurrentIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{reportViewConfig.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {Object.values(REPORT_VIEWS).map((view) => {
            const Icon = getIcon(view.icon);
            const isActive = reportView === view.id;

            return (
              <DropdownMenuItem
                key={view.id}
                onClick={() => handleModeChange(view.id)}
                className={cn(
                  "flex items-center justify-between",
                  isActive && "bg-primary/10",
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{view.name}</span>
                </div>
                {isActive && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {reportView !== "standard" && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onExport?.(reportView)}
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ReportViewModeSwitcher;
