"use client";

import React from "react";

import { MainLayout } from "@/components/layout/MainLayout";
import EnterpriseDataTable, {
  type Column,
} from "@/components/ui/EnterpriseDataTable";
import { EnterpriseButton } from "@/components/ui/EnterpriseButton";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Plus,
  Download,
  Send,
  Edit,
  Eye,
  CreditCard,
  Calendar,
  DollarSign,
  User,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";

// Mock data
const invoicesData = [
  {
    id: "INV-001",
    customer: "ABC Corporation",
    amount: "$2,500.00",
    status: "Paid",
    dueDate: "2024-01-15",
    issueDate: "2024-01-01",
    items: [
      {
        description: "Consulting Services",
        quantity: 40,
        rate: 50,
        total: 2000,
      },
      { description: "Additional Support", quantity: 5, rate: 100, total: 500 },
    ],
    subtotal: 2500,
    tax: 250,
    total: 2750,
  },
  {
    id: "INV-002",
    customer: "XYZ Industries",
    amount: "$1,800.00",
    status: "Pending",
    dueDate: "2024-01-20",
    issueDate: "2024-01-05",
    items: [
      { description: "Software License", quantity: 1, rate: 1500, total: 1500 },
      { description: "Support Package", quantity: 1, rate: 300, total: 300 },
    ],
    subtotal: 1800,
    tax: 180,
    total: 1980,
  },
  {
    id: "INV-003",
    customer: "Global Tech Ltd",
    amount: "$3,200.00",
    status: "Paid",
    dueDate: "2024-01-10",
    issueDate: "2024-01-02",
    items: [
      {
        description: "Development Services",
        quantity: 80,
        rate: 40,
        total: 3200,
      },
    ],
    subtotal: 3200,
    tax: 320,
    total: 3520,
  },
  {
    id: "INV-004",
    customer: "StartUp Inc",
    amount: "$950.00",
    status: "Overdue",
    dueDate: "2024-01-08",
    issueDate: "2023-12-25",
    items: [
      { description: "Design Services", quantity: 10, rate: 95, total: 950 },
    ],
    subtotal: 950,
    tax: 95,
    total: 1045,
  },
  {
    id: "INV-005",
    customer: "Enterprise Co",
    amount: "$5,100.00",
    status: "Sent",
    dueDate: "2024-01-25",
    issueDate: "2024-01-10",
    items: [
      {
        description: "Enterprise Package",
        quantity: 1,
        rate: 5000,
        total: 5000,
      },
      { description: "Setup Fee", quantity: 1, rate: 100, total: 100 },
    ],
    subtotal: 5100,
    tax: 510,
    total: 5610,
  },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState(invoicesData);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const invoiceColumns: Column<(typeof invoicesData)[0]>[] = [
    {
      key: "id",
      title: "Invoice ID",
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="font-mono text-sm font-medium text-primary">
            {value}
          </span>
        </div>
      ),
    },
    {
      key: "customer",
      title: "Customer",
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <div className="font-medium">{value}</div>
        </div>
      ),
    },
    {
      key: "amount",
      title: "Amount",
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1 font-semibold text-primary">
          <DollarSign className="h-4 w-4" />
          {value}
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      filterable: true,
      render: (value) => {
        const statusColors = {
          Paid: "bg-green-100 text-green-800",
          Pending: "bg-yellow-100 text-yellow-800",
          Overdue: "bg-red-100 text-red-800",
          Sent: "bg-blue-100 text-blue-800",
          Draft: "bg-gray-100 text-gray-800",
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value as keyof typeof statusColors]}`}
          >
            {value}
          </span>
        );
      },
    },
    {
      key: "dueDate",
      title: "Due Date",
      sortable: true,
      filterable: true,
      render: (value, row) => {
        const isOverdue = new Date(value) < new Date() && row.status !== "Paid";
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className={isOverdue ? "text-danger font-medium" : ""}>
              {value}
              {isOverdue && (
                <AlertCircle className="h-3 w-3 ml-1 text-danger" />
              )}
            </span>
          </div>
        );
      },
    },
  ];

  const handleSendInvoice = (invoice: any) => {
    console.log("Sending invoice:", invoice.id);
    // Implement send functionality
  };

  const handlePayInvoice = (invoice: any) => {
    console.log("Processing payment for:", invoice.id);
    // Implement payment functionality
  };

  const handleExportPDF = (invoice: any) => {
    console.log("Exporting PDF for:", invoice.id);
    // Implement PDF export functionality
  };

  const handleViewDetails = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const handleEditInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowAddModal(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Invoices</h1>
          <p className="text-gray-600">Manage customer invoices and payments</p>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Invoice Management</CardTitle>
              <EnterpriseButton
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowAddModal(true)}
              >
                Create Invoice
              </EnterpriseButton>
            </div>
          </CardHeader>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardContent className="p-0">
            <EnterpriseDataTable
              data={invoices}
              columns={invoiceColumns}
              searchable={true}
              exportable={true}
              paginated={true}
              onRowClick={(row) => handleViewDetails(row)}
              emptyMessage="No invoices found"
            />
          </CardContent>
        </Card>

        {/* Invoice Details Modal */}
        {showDetailsModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Invoice Details - {selectedInvoice.id}</CardTitle>
                  <EnterpriseButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    ×
                  </EnterpriseButton>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Invoice Header */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-primary mb-2">
                        Bill To
                      </h3>
                      <p className="text-gray-700">
                        {selectedInvoice.customer}
                      </p>
                      <p className="text-sm text-gray-500">Customer Address</p>
                      <p className="text-sm text-gray-500">City, State ZIP</p>
                    </div>
                    <div className="text-right">
                      <h3 className="font-semibold text-primary mb-2">
                        Invoice Details
                      </h3>
                      <p className="text-sm text-gray-600">
                        Invoice #: {selectedInvoice.id}
                      </p>
                      <p className="text-sm text-gray-600">
                        Issue Date: {selectedInvoice.issueDate}
                      </p>
                      <p className="text-sm text-gray-600">
                        Due Date: {selectedInvoice.dueDate}
                      </p>
                      <div className="mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedInvoice.status === "Paid"
                              ? "bg-green-100 text-green-800"
                              : selectedInvoice.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : selectedInvoice.status === "Overdue"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {selectedInvoice.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div>
                    <h3 className="font-semibold text-primary mb-4">
                      Line Items
                    </h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Description
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                              Quantity
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Rate
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedInvoice.items.map(
                            (item: any, index: number) => (
                              <tr key={index}>
                                <td className="px-4 py-3 text-sm">
                                  {item.description}
                                </td>
                                <td className="px-4 py-3 text-sm text-center">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-sm text-right">
                                  ${item.rate}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-medium">
                                  ${item.total}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${selectedInvoice.subtotal}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (10%):</span>
                        <span>${selectedInvoice.tax}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                        <span>Total:</span>
                        <span>${selectedInvoice.total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <EnterpriseButton
                      variant="secondary"
                      icon={<Edit className="h-4 w-4" />}
                      onClick={() => handleEditInvoice(selectedInvoice)}
                    >
                      Edit
                    </EnterpriseButton>
                    <EnterpriseButton
                      variant="secondary"
                      icon={<Download className="h-4 w-4" />}
                      onClick={() => handleExportPDF(selectedInvoice)}
                    >
                      Download
                    </EnterpriseButton>
                    <EnterpriseButton
                      variant="secondary"
                      icon={<Send className="h-4 w-4" />}
                      onClick={() => handleSendInvoice(selectedInvoice)}
                    >
                      Send Invoice
                    </EnterpriseButton>
                    {selectedInvoice.status !== "Paid" && (
                      <EnterpriseButton
                        variant="primary"
                        icon={<CreditCard className="h-4 w-4" />}
                        onClick={() => handlePayInvoice(selectedInvoice)}
                      >
                        Record Payment
                      </EnterpriseButton>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add/Edit Invoice Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {selectedInvoice ? "Edit Invoice" : "Create New Invoice"}
                  </CardTitle>
                  <EnterpriseButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedInvoice(null);
                    }}
                  >
                    ×
                  </EnterpriseButton>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Customer Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary">
                        <option>ABC Corporation</option>
                        <option>XYZ Industries</option>
                        <option>Global Tech Ltd</option>
                        <option>StartUp Inc</option>
                        <option>Enterprise Co</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Invoice Number
                      </label>

                      <label htmlFor="input-l2ulzdwgx" className="sr-only">
                        Text
                      </label>
                      <input
                        id="input-l2ulzdwgx"
                        type="text"
                        placeholder="INV-XXX"
                        defaultValue={selectedInvoice?.id || ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Issue Date
                      </label>

                      <label htmlFor="input-jbpweclu2" className="sr-only">
                        Date
                      </label>
                      <input
                        id="input-jbpweclu2"
                        type="date"
                        defaultValue={selectedInvoice?.issueDate || ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date
                      </label>

                      <label htmlFor="input-turo6d0mm" className="sr-only">
                        Date
                      </label>
                      <input
                        id="input-turo6d0mm"
                        type="date"
                        defaultValue={selectedInvoice?.dueDate || ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                      />
                    </div>
                  </div>

                  {/* Line Items */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-primary">Line Items</h3>
                      <EnterpriseButton
                        variant="secondary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                      >
                        Add Item
                      </EnterpriseButton>
                    </div>

                    <div className="space-y-2">
                      {(
                        selectedInvoice?.items || [
                          { description: "", quantity: 1, rate: 0, total: 0 },
                        ]
                      ).map((item: any, index: number) => (
                        <div key={index} className="grid grid-cols-4 gap-2">
                          <label htmlFor="input-akdo88zpo" className="sr-only">
                            Text
                          </label>
                          <input
                            id="input-akdo88zpo"
                            type="text"
                            placeholder="Description"
                            defaultValue={item.description}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                          />

                          <label htmlFor="input-esbgaotz3" className="sr-only">
                            Number
                          </label>
                          <input
                            id="input-esbgaotz3"
                            type="number"
                            placeholder="Qty"
                            defaultValue={item.quantity}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                          />

                          <label htmlFor="input-c2fdiaeqa" className="sr-only">
                            Number
                          </label>
                          <input
                            id="input-c2fdiaeqa"
                            type="number"
                            placeholder="Rate"
                            defaultValue={item.rate}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                          />

                          <label htmlFor="input-t5f2r7cg7" className="sr-only">
                            Number
                          </label>
                          <input
                            id="input-t5f2r7cg7"
                            type="number"
                            placeholder="Total"
                            defaultValue={item.total}
                            readOnly
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${selectedInvoice?.subtotal || "0.00"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (10%):</span>
                        <span>${selectedInvoice?.tax || "0.00"}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                        <span>Total:</span>
                        <span>${selectedInvoice?.total || "0.00"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <EnterpriseButton
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        setShowAddModal(false);
                      }}
                    >
                      Cancel
                    </EnterpriseButton>
                    <EnterpriseButton
                      variant="primary"
                      className="flex-1"
                      onClick={() => {
                        setShowAddModal(false);
                        setSelectedInvoice(null);
                      }}
                    >
                      {selectedInvoice ? "Update Invoice" : "Create Invoice"}
                    </EnterpriseButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
