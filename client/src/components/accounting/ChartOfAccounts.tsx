/**
 * Chart of Accounts Component
 * Full-featured COA management with hierarchical display
 */

import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useView } from "@/contexts/ViewContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Calculator,
  Building2,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface Account {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  subtype?: string;
  parentId?: string | null;
  isBankAccount: boolean;
  isActive: boolean;
  balance: number;
  description?: string;
  taxCode?: string;
  trackLocation: boolean;
  trackDepartment: boolean;
  trackProject: boolean;
  trackClass: boolean;
  children?: Account[];
  level: number;
}

interface CreateAccountData {
  code: string;
  name: string;
  type: Account["type"];
  subtype?: string;
  parentId?: string;
  isBankAccount?: boolean;
  taxCode?: string;
  trackLocation?: boolean;
  trackDepartment?: boolean;
  trackProject?: boolean;
  trackClass?: boolean;
  description?: string;
}

const ACCOUNT_TYPES = [
  { value: "asset", label: "Asset", color: "bg-blue-100 text-blue-800" },
  { value: "liability", label: "Liability", color: "bg-red-100 text-red-800" },
  { value: "equity", label: "Equity", color: "bg-green-100 text-green-800" },
  {
    value: "revenue",
    label: "Revenue",
    color: "bg-emerald-100 text-emerald-800",
  },
  {
    value: "expense",
    label: "Expense",
    color: "bg-orange-100 text-orange-800",
  },
];

const ACCOUNT_SUBTYPES: Record<string, string[]> = {
  asset: [
    "current_asset",
    "long_term_asset",
    "contra_asset",
    "bank",
    "accounts_receivable",
    "inventory",
    "fixed_asset",
  ],
  liability: [
    "current_liability",
    "long_term_liability",
    "accounts_payable",
    "credit_card",
    "payroll_liability",
  ],
  equity: ["equity", "retained_earnings", "owner_equity", "dividend"],
  revenue: [
    "operating_revenue",
    "non_operating_revenue",
    "sales",
    "service_revenue",
  ],
  expense: [
    "cogs",
    "operating_expense",
    "payroll_expense",
    "marketing",
    "rent",
    "utilities",
  ],
};

export const ChartOfAccounts: React.FC = () => {
  const { toast } = useToast();
  const { mainView, mainViewConfig } = useView();
  const queryClient = useQueryClient();
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(
    new Set(),
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Fetch accounts
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const response = await api.get("/ledger/accounts");
      return response.data.data;
    },
  });

  // Create account mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateAccountData) => {
      const response = await api.post("/ledger/accounts", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Account created",
        description: "The account has been added to your Chart of Accounts.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating account",
        description:
          error.response?.data?.error?.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Update account mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateAccountData>;
    }) => {
      const response = await api.patch(`/ledger/accounts/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setEditingAccount(null);
      toast({
        title: "Account updated",
        description: "Changes have been saved.",
      });
    },
  });

  // Build hierarchical structure
  const buildHierarchy = useCallback((flatAccounts: Account[]): Account[] => {
    const map = new Map<string, Account>();
    const roots: Account[] = [];

    // First pass: create map and initialize children arrays
    flatAccounts.forEach((acc) => {
      map.set(acc.id, { ...acc, children: [], level: 0 });
    });

    // Second pass: build hierarchy
    flatAccounts.forEach((acc) => {
      const account = map.get(acc.id)!;
      if (acc.parentId && map.has(acc.parentId)) {
        const parent = map.get(acc.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(account);
        account.level = parent.level + 1;
      } else {
        roots.push(account);
      }
    });

    return roots;
  }, []);

  // Filter and build hierarchy
  const hierarchicalAccounts = React.useMemo(() => {
    let filtered = accounts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = accounts.filter(
        (acc: Account) =>
          acc.name.toLowerCase().includes(query) ||
          acc.code.toLowerCase().includes(query),
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((acc: Account) => acc.type === selectedType);
    }

    return buildHierarchy(filtered);
  }, [accounts, searchQuery, selectedType, buildHierarchy]);

  // Toggle expansion
  const toggleExpand = (accountId: string) => {
    setExpandedAccounts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  // Expand all
  const expandAll = () => {
    const allIds = new Set(accounts.map((a: Account) => a.id));
    setExpandedAccounts(allIds);
  };

  // Collapse all
  const collapseAll = () => {
    setExpandedAccounts(new Set());
  };

  // Render account row
  const renderAccountRow = (account: Account): JSX.Element => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedAccounts.has(account.id);
    const typeConfig = ACCOUNT_TYPES.find((t) => t.value === account.type);

    return (
      <React.Fragment key={account.id}>
        <TableRow
          className={cn(
            "hover:bg-muted/50 cursor-pointer",
            !account.isActive && "opacity-50",
          )}
          style={{ paddingLeft: `${account.level * 24}px` }}
        >
          <TableCell className="w-8">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(account.id)}
                className="p-1 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
          </TableCell>
          <TableCell className="font-medium">{account.code}</TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <span style={{ marginLeft: `${account.level * 16}px` }}>
                {account.name}
              </span>
              {account.isBankAccount && (
                <Badge variant="secondary" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  Bank
                </Badge>
              )}
              {!account.isActive && (
                <Badge variant="outline" className="text-xs">
                  Inactive
                </Badge>
              )}
            </div>
          </TableCell>
          <TableCell>
            <Badge className={cn("text-xs", typeConfig?.color)}>
              {typeConfig?.label}
            </Badge>
          </TableCell>
          <TableCell className="text-right font-mono">
            $
            {account.balance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </TableCell>
          <TableCell>
            <div className="flex gap-1">
              {account.trackLocation && (
                <Badge variant="outline" className="text-xs">
                  Loc
                </Badge>
              )}
              {account.trackDepartment && (
                <Badge variant="outline" className="text-xs">
                  Dept
                </Badge>
              )}
              {account.trackProject && (
                <Badge variant="outline" className="text-xs">
                  Proj
                </Badge>
              )}
              {account.trackClass && (
                <Badge variant="outline" className="text-xs">
                  Class
                </Badge>
              )}
            </div>
          </TableCell>
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingAccount(account)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    // Duplicate logic
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    // Deactivate logic
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {account.isActive ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        {hasChildren &&
          isExpanded &&
          account.children!.map((child) => renderAccountRow(child))}
      </React.Fragment>
    );
  };

  // Accountant view shows additional columns and features
  const isAccountantView = mainView === "accountant";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {mainViewConfig.terminology.accounting || "Chart of Accounts"}
          </h1>
          <p className="text-muted-foreground">
            Manage your{" "}
            {mainView === "business" ? "money accounts" : "General Ledger"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" onClick={collapseAll}>
            Collapse All
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Export logic
            }}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Account</DialogTitle>
              </DialogHeader>
              <AccountForm
                onSubmit={(data) => createMutation.mutate(data)}
                isLoading={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search accounts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ACCOUNT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Accounts Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Dimensions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading accounts...
                </TableCell>
              </TableRow>
            ) : hierarchicalAccounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No accounts found. Create your first account to get started.
                </TableCell>
              </TableRow>
            ) : (
              hierarchicalAccounts.map((account) => renderAccountRow(account))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {editingAccount && (
        <Dialog
          open={!!editingAccount}
          onOpenChange={() => setEditingAccount(null)}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
            </DialogHeader>
            <AccountForm
              account={editingAccount}
              onSubmit={(data) =>
                updateMutation.mutate({ id: editingAccount.id, data })
              }
              isLoading={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Account Form Component
interface AccountFormProps {
  account?: Account;
  onSubmit: (data: CreateAccountData) => void;
  isLoading: boolean;
}

const AccountForm: React.FC<AccountFormProps> = ({
  account,
  onSubmit,
  isLoading,
}) => {
  const [formData, setFormData] = useState<CreateAccountData>({
    code: account?.code || "",
    name: account?.name || "",
    type: account?.type || "asset",
    subtype: account?.subtype || "",
    parentId: account?.parentId || undefined,
    isBankAccount: account?.isBankAccount || false,
    taxCode: account?.taxCode || "",
    trackLocation: account?.trackLocation || false,
    trackDepartment: account?.trackDepartment || false,
    trackProject: account?.trackProject || false,
    trackClass: account?.trackClass || false,
    description: account?.description || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Account Code</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g., 1000"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Account Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Cash"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Account Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value: Account["type"]) =>
              setFormData({ ...formData, type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subtype">Subtype</Label>
          <Select
            value={formData.subtype}
            onValueChange={(value) =>
              setFormData({ ...formData, subtype: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subtype" />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_SUBTYPES[formData.type]?.map((subtype) => (
                <SelectItem key={subtype} value={subtype}>
                  {subtype
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Optional description"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="isBankAccount"
            checked={formData.isBankAccount}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isBankAccount: checked })
            }
          />
          <Label htmlFor="isBankAccount">Bank Account</Label>
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-4">
        <Label className="font-medium">Dimensional Tracking</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="trackLocation"
              checked={formData.trackLocation}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, trackLocation: checked })
              }
            />
            <Label htmlFor="trackLocation">Location</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="trackDepartment"
              checked={formData.trackDepartment}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, trackDepartment: checked })
              }
            />
            <Label htmlFor="trackDepartment">Department</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="trackProject"
              checked={formData.trackProject}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, trackProject: checked })
              }
            />
            <Label htmlFor="trackProject">Project</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="trackClass"
              checked={formData.trackClass}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, trackClass: checked })
              }
            />
            <Label htmlFor="trackClass">Class</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Saving..."
            : account
              ? "Update Account"
              : "Create Account"}
        </Button>
      </div>
    </form>
  );
};

export default ChartOfAccounts;
