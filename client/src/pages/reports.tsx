import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Fragment } from "react";

const profitLossData = [
  { category: "Revenue", subcategories: [
    { name: "Sales Revenue", amount: 186900.00 },
  ], total: 186900.00 },
  { category: "Cost of Goods Sold", subcategories: [
    { name: "Direct Materials", amount: 0 },
  ], total: 0 },
  { category: "Gross Profit", total: 186900.00, isCalculated: true },
  { category: "Operating Expenses", subcategories: [
    { name: "Salaries & Wages", amount: 72000.00 },
    { name: "Rent", amount: 18000.00 },
    { name: "Utilities", amount: 5200.00 },
    { name: "Office Supplies", amount: 3420.00 },
    { name: "Marketing", amount: 15600.00 },
    { name: "Professional Services", amount: 12680.00 },
  ], total: 126900.00 },
  { category: "Net Income", total: 60000.00, isCalculated: true, isFinal: true },
];

const balanceSheetData = {
  assets: [
    { category: "Current Assets", items: [
      { name: "Cash", amount: 45200.00 },
      { name: "Accounts Receivable", amount: 18200.00 },
      { name: "Inventory", amount: 21840.30 },
    ], total: 85240.30 },
    { category: "Fixed Assets", items: [
      { name: "Equipment", amount: 28500.00 },
      { name: "Furniture", amount: 11740.20 },
    ], total: 40240.20 },
  ],
  totalAssets: 125480.50,
  liabilities: [
    { category: "Current Liabilities", items: [
      { name: "Accounts Payable", amount: 5453.30 },
      { name: "Credit Card", amount: 2840.50 },
      { name: "Taxes Payable", amount: 27387.00 },
    ], total: 35680.80 },
  ],
  totalLiabilities: 35680.80,
  equity: [
    { name: "Owner's Equity", amount: 50000.00 },
    { name: "Retained Earnings", amount: 39799.70 },
  ],
  totalEquity: 89799.70,
};

const cashFlowData = [
  { category: "Operating Activities", items: [
    { name: "Net Income", amount: 60000.00 },
    { name: "Adjustments for Non-Cash Items", amount: 0 },
    { name: "Changes in Working Capital", amount: -5200.00 },
  ], total: 54800.00 },
  { category: "Investing Activities", items: [
    { name: "Purchase of Equipment", amount: -12000.00 },
  ], total: -12000.00 },
  { category: "Financing Activities", items: [
    { name: "Owner's Investment", amount: 10000.00 },
  ], total: 10000.00 },
  { netChange: 52800.00 },
];

export default function Reports() {
  const [dateRange, setDateRange] = useState("2024-01-01 to 2024-12-31");

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Financial Reports</h1>
          <p className="text-muted-foreground">View comprehensive financial statements and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-date-range">
            <Calendar className="h-4 w-4 mr-2" />
            {dateRange}
          </Button>
          <Button data-testid="button-export-report">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pnl" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pnl" data-testid="tab-profit-loss">P&L</TabsTrigger>
          <TabsTrigger value="balance" data-testid="tab-balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cashflow" data-testid="tab-cash-flow">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="pnl" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>Income and expenses for the period</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {profitLossData.map((section, idx) => (
                    <Fragment key={idx}>
                      <TableRow className={section.isCalculated ? "font-semibold border-t-2" : ""}>
                        <TableCell colSpan={section.subcategories ? 1 : 2} className={section.isFinal ? "text-lg font-bold" : section.isCalculated ? "font-semibold" : "font-medium"}>
                          {section.category}
                        </TableCell>
                        {!section.subcategories && (
                          <TableCell className={`text-right tabular-nums ${section.isFinal ? 'text-lg font-bold text-chart-2' : section.isCalculated ? 'font-semibold' : ''}`}>
                            ${section.total.toFixed(2)}
                          </TableCell>
                        )}
                      </TableRow>
                      {section.subcategories?.map((sub, subIdx) => (
                        <TableRow key={subIdx}>
                          <TableCell className="pl-8">{sub.name}</TableCell>
                          <TableCell className="text-right tabular-nums">${sub.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      {section.subcategories && (
                        <TableRow className="font-medium">
                          <TableCell>Total {section.category}</TableCell>
                          <TableCell className="text-right tabular-nums">${section.total.toFixed(2)}</TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>Assets, liabilities, and equity as of date</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Assets */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Assets</h3>
                <Table>
                  <TableBody>
                    {balanceSheetData.assets.map((section, idx) => (
                      <React.Fragment key={idx}>
                        <TableRow>
                          <TableCell className="font-medium">{section.category}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        {section.items.map((item, itemIdx) => (
                          <TableRow key={itemIdx}>
                            <TableCell className="pl-8">{item.name}</TableCell>
                            <TableCell className="text-right tabular-nums">${item.amount.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-medium">
                          <TableCell>Total {section.category}</TableCell>
                          <TableCell className="text-right tabular-nums">${section.total.toFixed(2)}</TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                    <TableRow className="font-semibold border-t-2">
                      <TableCell>Total Assets</TableCell>
                      <TableCell className="text-right tabular-nums">${balanceSheetData.totalAssets.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Liabilities & Equity */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Liabilities & Equity</h3>
                <Table>
                  <TableBody>
                    {balanceSheetData.liabilities.map((section, idx) => (
                      <React.Fragment key={idx}>
                        <TableRow>
                          <TableCell className="font-medium">{section.category}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        {section.items.map((item, itemIdx) => (
                          <TableRow key={itemIdx}>
                            <TableCell className="pl-8">{item.name}</TableCell>
                            <TableCell className="text-right tabular-nums">${item.amount.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-medium">
                          <TableCell>Total {section.category}</TableCell>
                          <TableCell className="text-right tabular-nums">${section.total.toFixed(2)}</TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                    <TableRow className="font-medium border-t">
                      <TableCell>Total Liabilities</TableCell>
                      <TableCell className="text-right tabular-nums">${balanceSheetData.totalLiabilities.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="border-t">
                      <TableCell className="font-medium">Equity</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    {balanceSheetData.equity.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="pl-8">{item.name}</TableCell>
                        <TableCell className="text-right tabular-nums">${item.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-medium border-t">
                      <TableCell>Total Equity</TableCell>
                      <TableCell className="text-right tabular-nums">${balanceSheetData.totalEquity.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="font-semibold border-t-2">
                      <TableCell>Total Liabilities & Equity</TableCell>
                      <TableCell className="text-right tabular-nums">${(balanceSheetData.totalLiabilities + balanceSheetData.totalEquity).toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
              <CardDescription>Cash inflows and outflows for the period</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {cashFlowData.map((section, idx) => (
                    <React.Fragment key={idx}>
                      {section.category ? (
                        <>
                          <TableRow>
                            <TableCell className="font-medium">{section.category}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                          {section.items?.map((item, itemIdx) => (
                            <TableRow key={itemIdx}>
                              <TableCell className="pl-8">{item.name}</TableCell>
                              <TableCell className={`text-right tabular-nums ${item.amount > 0 ? 'text-chart-2' : item.amount < 0 ? 'text-destructive' : ''}`}>
                                ${item.amount.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="font-medium">
                            <TableCell>Net Cash from {section.category}</TableCell>
                            <TableCell className={`text-right tabular-nums ${section.total && section.total > 0 ? 'text-chart-2' : section.total && section.total < 0 ? 'text-destructive' : ''}`}>
                              ${section.total?.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </>
                      ) : (
                        <TableRow className="font-semibold border-t-2">
                          <TableCell>Net Change in Cash</TableCell>
                          <TableCell className={`text-right tabular-nums text-lg ${section.netChange && section.netChange > 0 ? 'text-chart-2' : ''}`}>
                            ${section.netChange?.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
