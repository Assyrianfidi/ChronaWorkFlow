/**
 * BankingViewSwitcher Component
 * Filter banking transactions by For Review, Categorized, Excluded, All
 */

import React from 'react';
import { useView } from '@/contexts/ViewContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  List,
} from 'lucide-react';
import { BANKING_VIEWS } from '@/config/view.config';

export const BankingViewSwitcher: React.FC<{
  counts?: {
    'for-review': number;
    categorized: number;
    excluded: number;
    all: number;
  };
}> = ({ counts }) => {
  const { bankingView, setBankingView, bankingViewConfig } = useView();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'AlertCircle': return AlertCircle;
      case 'CheckCircle': return CheckCircle;
      case 'XCircle': return XCircle;
      case 'List': return List;
      default: return List;
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {Object.values(BANKING_VIEWS).map((view) => {
        const Icon = getIcon(view.icon);
        const isActive = bankingView === view.id;
        const count = counts?.[view.id];

        return (
          <Button
            key={view.id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBankingView(view.id)}
            className={cn(
              'gap-2',
              isActive && 'ring-2 ring-offset-1'
            )}
            style={{
              borderColor: isActive ? view.color : undefined,
              backgroundColor: isActive ? view.color : undefined,
            }}
          >
            <Icon className="h-4 w-4" />
            <span>{view.name}</span>
            {count !== undefined && count > 0 && (
              <Badge
                variant={isActive ? 'secondary' : 'default'}
                className="ml-1 text-[10px]"
              >
                {count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
};

export default BankingViewSwitcher;
