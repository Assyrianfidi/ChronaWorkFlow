import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ChevronRight, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  children?: Account[];
  isExpanded?: boolean;
}

const accountsData: Account[] = [
  {
    id: "1",
    code: "1000",
    name: "Assets",
    type: "asset",
    balance: 125480.50,
    isExpanded: true,
    children: [
      { id: "2", code: "1100", name: "Current Assets", type: "asset", balance: 85240.30, isExpanded: true, children: [
        { id: "3", code: "1110", name: "Cash", type: "asset", balance: 45200.00 },
        { id: "4", code: "1120", name: "Accounts Receivable", type: "asset", balance: 18200.00 },
        { id: "5", code: "1130", name: "Inventory", type: "asset", balance: 21840.30 },
      ]},
      { id: "6", code: "1200", name: "Fixed Assets", type: "asset", balance: 40240.20, children: [
        { id: "7", code: "1210", name: "Equipment", type: "asset", balance: 28500.00 },
        { id: "8", code: "1220", name: "Furniture", type: "asset", balance: 11740.20 },
      ]},
    ],
  },
  {
    id: "9",
    code: "2000",
    name: "Liabilities",
    type: "liability",
    balance: 35680.80,
    children: [
      { id: "10", code: "2100", name: "Current Liabilities", type: "liability", balance: 35680.80, children: [
        { id: "11", code: "2110", name: "Accounts Payable", type: "liability", balance: 5453.30 },
        { id: "12", code: "2120", name: "Credit Card", type: "liability", balance: 2840.50 },
        { id: "13", code: "2130", name: "Taxes Payable", type: "liability", balance: 27387.00 },
      ]},
    ],
  },
  {
    id: "14",
    code: "3000",
    name: "Equity",
    type: "equity",
    balance: 89799.70,
    children: [
      { id: "15", code: "3100", name: "Owner's Equity", type: "equity", balance: 50000.00 },
      { id: "16", code: "3200", name: "Retained Earnings", type: "equity", balance: 39799.70 },
    ],
  },
  {
    id: "17",
    code: "4000",
    name: "Revenue",
    type: "revenue",
    balance: 186900.00,
    children: [
      { id: "18", code: "4100", name: "Sales Revenue", type: "revenue", balance: 186900.00 },
    ],
  },
  {
    id: "19",
    code: "5000",
    name: "Expenses",
    type: "expense",
    balance: 126900.00,
    children: [
      { id: "20", code: "5100", name: "Operating Expenses", type: "expense", balance: 98620.00, children: [
        { id: "21", code: "5110", name: "Salaries & Wages", type: "expense", balance: 72000.00 },
        { id: "22", code: "5120", name: "Rent", type: "expense", balance: 18000.00 },
        { id: "23", code: "5130", name: "Utilities", type: "expense", balance: 5200.00 },
        { id: "24", code: "5140", name: "Office Supplies", type: "expense", balance: 3420.00 },
      ]},
      { id: "25", code: "5200", name: "Other Expenses", type: "expense", balance: 28280.00, children: [
        { id: "26", code: "5210", name: "Marketing", type: "expense", balance: 15600.00 },
        { id: "27", code: "5220", name: "Professional Services", type: "expense", balance: 12680.00 },
      ]},
    ],
  },
];

const typeColors = {
  asset: "default",
  liability: "destructive",
  equity: "secondary",
  revenue: "default",
  expense: "secondary",
} as const;

export default function Accounts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["1"]));

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const renderAccount = (account: Account, level: number = 0) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedIds.has(account.id);
    const matchesSearch = searchQuery === "" || 
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.code.includes(searchQuery);

    if (!matchesSearch && searchQuery !== "") return null;

    return (
      <>
        <TableRow key={account.id} data-testid={`account-row-${account.id}`}>
          <TableCell>
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 1.5}rem` }}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(account.id)}
                  className="hover-elevate active-elevate-2 rounded p-1"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <span className="w-6" />
              )}
              <span className={`${level === 0 ? 'font-semibold' : level === 1 ? 'font-medium' : ''}`}>
                {account.code}
              </span>
            </div>
          </TableCell>
          <TableCell className={`${level === 0 ? 'font-semibold' : level === 1 ? 'font-medium' : ''}`}>
            {account.name}
          </TableCell>
          <TableCell>
            <Badge variant={typeColors[account.type as keyof typeof typeColors]}>
              {account.type}
            </Badge>
          </TableCell>
          <TableCell className={`text-right tabular-nums ${level === 0 ? 'font-semibold' : level === 1 ? 'font-medium' : ''}`}>
            ${account.balance.toFixed(2)}
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && account.children?.map(child => renderAccount(child, level + 1))}
      </>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Chart of Accounts</h1>
          <p className="text-muted-foreground">Manage your company's account structure</p>
        </div>
        <Button data-testid="button-create-account">
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Account Hierarchy</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-accounts"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead className="w-32">Type</TableHead>
                <TableHead className="text-right w-40">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountsData.map(account => renderAccount(account))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
