import React from "react";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  href: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  return (
    <div className="space-y-2">
      {actions.map((action, index) => (
        <Link
          key={index}
          to={action.href}
          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors group"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <action.icon className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  );
};

export default QuickActions;
