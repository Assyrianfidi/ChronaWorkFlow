import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Input from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  Search,
  Clock,
  ArrowRight,
  FileText,
  Users,
  Building2,
  Receipt,
  BookOpen,
  Package,
  BarChart3,
  X,
  Sparkles,
} from 'lucide-react';
import { SEARCH_ENTITIES } from '@/config/navigation.config';

// ============================================================================
// TYPES
// ============================================================================

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  path: string;
  entityType: 'transaction' | 'customer' | 'vendor' | 'invoice' | 'bill' | 'account' | 'product' | 'report' | 'employee';
  date?: string;
  amount?: number;
  status?: string;
}

interface SearchHistory {
  id: string;
  query: string;
  timestamp: Date;
  resultCount: number;
}

// ============================================================================
// MOCK SEARCH DATA (Replace with real API calls)
// ============================================================================

const MOCK_RESULTS: SearchResult[] = [
  { id: '1', type: 'invoice', title: 'INV-001', subtitle: 'Acme Corp - $5,000.00', path: '/invoices/1', entityType: 'invoice', date: '2024-01-15', amount: 5000, status: 'Open' },
  { id: '2', type: 'customer', title: 'Acme Corporation', subtitle: 'Active Customer - $45,000 YTD', path: '/customers/1', entityType: 'customer' },
  { id: '3', type: 'transaction', title: 'Deposit #1234', subtitle: 'Checking Account - $12,500.00', path: '/banking/transactions/1234', entityType: 'transaction', date: '2024-01-14', amount: 12500 },
  { id: '4', type: 'bill', title: 'BILL-045', subtitle: 'Office Supplies Inc - $850.00', path: '/bills/45', entityType: 'bill', date: '2024-01-13', amount: 850, status: 'Overdue' },
  { id: '5', type: 'account', title: '1000 - Cash and Equivalents', subtitle: 'Asset Account - $125,000.00', path: '/chart-of-accounts/1000', entityType: 'account' },
  { id: '6', type: 'product', title: 'Professional Services', subtitle: 'Service Item - $150.00/hr', path: '/products/1', entityType: 'product' },
  { id: '7', type: 'report', title: 'Profit & Loss', subtitle: 'Standard Financial Report', path: '/reports/pnl', entityType: 'report' },
  { id: '8', type: 'vendor', title: 'Office Supplies Inc', subtitle: 'Active Vendor - $12,500 YTD', path: '/vendors/1', entityType: 'vendor' },
  { id: '9', type: 'employee', title: 'John Smith', subtitle: 'Engineering - $85,000/yr', path: '/employees/1', entityType: 'employee' },
  { id: '10', type: 'invoice', title: 'INV-002', subtitle: 'TechStart Inc - $8,500.00', path: '/invoices/2', entityType: 'invoice', date: '2024-01-12', amount: 8500, status: 'Paid' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case 'invoice': return FileText;
    case 'customer': return Users;
    case 'vendor': return Building2;
    case 'bill': return Receipt;
    case 'account': return BookOpen;
    case 'product': return Package;
    case 'report': return BarChart3;
    case 'employee': return Users;
    case 'transaction': return Receipt;
    default: return FileText;
  }
};

const getEntityColor = (entityType: string) => {
  switch (entityType) {
    case 'invoice': return 'bg-blue-100 text-blue-700';
    case 'customer': return 'bg-emerald-100 text-emerald-700';
    case 'vendor': return 'bg-amber-100 text-amber-700';
    case 'bill': return 'bg-red-100 text-red-700';
    case 'account': return 'bg-purple-100 text-purple-700';
    case 'product': return 'bg-cyan-100 text-cyan-700';
    case 'report': return 'bg-indigo-100 text-indigo-700';
    case 'employee': return 'bg-pink-100 text-pink-700';
    case 'transaction': return 'bg-slate-100 text-slate-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

// ============================================================================
// GLOBAL SEARCH COMPONENT
// ============================================================================

interface GlobalSearchProps {
  className?: string;
  shortcut?: boolean;
  variant?: 'default' | 'compact';
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  className,
  shortcut = true,
  variant = 'default',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchHistory[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('qb-search-history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentSearches(parsed.map((s: SearchHistory) => ({
          ...s,
          timestamp: new Date(s.timestamp)
        })).slice(0, 5));
      } catch (e) {
        console.error('Failed to parse search history', e);
      }
    }
  }, []);

  // Save recent searches
  const saveRecentSearch = useCallback((query: string, resultCount: number) => {
    if (!query.trim()) return;
    
    const newSearch: SearchHistory = {
      id: Date.now().toString(),
      query,
      timestamp: new Date(),
      resultCount,
    };
    
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.query !== query);
      const updated = [newSearch, ...filtered].slice(0, 10);
      localStorage.setItem('qb-search-history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Search function
  const performSearch = useCallback((searchQuery: string, filter?: string | null) => {
    if (!searchQuery.trim() && !filter) {
      setResults([]);
      return;
    }

    // Simulate API search
    let filtered = MOCK_RESULTS;
    
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(result =>
        result.title.toLowerCase().includes(lowerQuery) ||
        result.subtitle?.toLowerCase().includes(lowerQuery) ||
        result.type.toLowerCase().includes(lowerQuery)
      );
    }
    
    if (filter) {
      filtered = filtered.filter(result => result.entityType === filter);
    }
    
    setResults(filtered);
    setSelectedIndex(filtered.length > 0 ? 0 : -1);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, activeFilter);
    }, 150);
    
    return () => clearTimeout(timer);
  }, [query, activeFilter, performSearch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      
      // Escape to close
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
      
      // Arrow navigation when open
      if (open) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
          e.preventDefault();
          handleResultClick(results[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIndex]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleResultClick = useCallback((result: SearchResult) => {
    saveRecentSearch(query, results.length);
    setOpen(false);
    setQuery('');
    setResults([]);
    navigate(result.path);
  }, [navigate, query, results.length, saveRecentSearch]);

  const handleRecentClick = useCallback((search: SearchHistory) => {
    setQuery(search.query);
    performSearch(search.query, activeFilter);
  }, [activeFilter, performSearch]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('qb-search-history');
  }, []);

  return (
    <>
      {/* Search Trigger Button */}
      <Button
        variant="outline"
        className={cn(
          'relative h-9 w-full justify-start rounded-md bg-muted/50 text-sm font-normal text-muted-foreground shadow-none hover:bg-accent hover:text-accent-foreground',
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4 shrink-0" />
        <span className="flex-1 text-left truncate">Search transactions, customers...</span>
        {shortcut && (
          <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        )}
      </Button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          
          {/* Search Input */}
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-5 w-5 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search anything..."
              className="h-10 flex-1 border-0 bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <kbd className="ml-2 hidden h-7 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium opacity-100 sm:flex">
              ESC
            </kbd>
          </div>

          {/* Entity Type Filters */}
          <div className="border-b px-3 py-2">
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={activeFilter === null ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveFilter(null)}
              >
                All
              </Button>
              {SEARCH_ENTITIES.map((entity) => {
                const Icon = entity.icon;
                const isActive = activeFilter === entity.type;
                return (
                  <Button
                    key={entity.type}
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => setActiveFilter(isActive ? null : entity.type)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{entity.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Results Area */}
          <ScrollArea className="max-h-[60vh]">
            {/* Search Results */}
            {results.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Results ({results.length})
                </div>
                <div className="space-y-0.5">
                  {results.map((result, index) => {
                    const Icon = getEntityIcon(result.entityType);
                    const colorClass = getEntityColor(result.entityType);
                    const isSelected = index === selectedIndex;
                    
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className={cn(
                          'flex items-start gap-3 w-full px-3 py-2.5 rounded-md text-left transition-colors',
                          isSelected ? 'bg-accent' : 'hover:bg-accent/50'
                        )}
                      >
                        <div className={cn('mt-0.5 p-1.5 rounded-md shrink-0', colorClass)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{result.title}</span>
                            {result.status && (
                              <Badge 
                                variant={result.status === 'Overdue' ? 'destructive' : 'secondary'}
                                className="h-4 px-1 text-[10px]"
                              >
                                {result.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                          {result.date && (
                            <p className="text-xs text-muted-foreground mt-0.5">{result.date}</p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {query === '' && recentSearches.length > 0 && (
              <div className="p-2">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Recent Searches
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground"
                    onClick={clearRecentSearches}
                  >
                    Clear
                  </Button>
                </div>
                <div className="space-y-0.5">
                  {recentSearches.map((search) => (
                    <button
                      key={search.id}
                      onClick={() => handleRecentClick(search)}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-left hover:bg-accent/50 transition-colors"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-sm">{search.query}</span>
                      <span className="text-xs text-muted-foreground">
                        {search.resultCount} results
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {query !== '' && results.length === 0 && (
              <div className="p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  No results found for &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try searching with different keywords
                </p>
              </div>
            )}

            {/* Initial State - No Query */}
            {query === '' && recentSearches.length === 0 && (
              <div className="p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6 text-amber-500" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Start typing to search
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Search across transactions, customers, vendors, invoices, and more
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="h-5 px-1 rounded border bg-muted font-mono text-[10px]">↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="h-5 px-1 rounded border bg-muted font-mono text-[10px]">↵</kbd>
                <span>Select</span>
              </span>
            </div>
            <span>Pro tip: Use ⌘K anytime to search</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlobalSearch;
