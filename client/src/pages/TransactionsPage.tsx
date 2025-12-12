import React, { useEffect, useState } from "react";
// @ts-ignore
import { useTransactions } from '../contexts/TransactionsContext.js.js';
// @ts-ignore
import { Button } from '../components/ui/button.js.js';
// @ts-ignore
import { DashboardShell } from '../components/ui/layout/DashboardShell.js.js';

// @ts-ignore
const TransactionsPage: React.FC = () => {
  const { state, fetchTransactions, createTransaction, clearError } =
    useTransactions();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    transactionNumber: "",
    date: new Date().toISOString().split("T")[0],
    type: "journal_entry" as const,
    totalAmount: "",
    description: "",
    referenceNumber: "",
    lines: [
      { accountId: "", debit: "", credit: "", description: "" },
      { accountId: "", debit: "", credit: "", description: "" },
    ],
  });

  useEffect(() => {
    if (state.selectedCompanyId) {
      fetchTransactions(state.selectedCompanyId);
    }
  }, [state.selectedCompanyId, fetchTransactions]);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.selectedCompanyId) return;

    try {
      await createTransaction({
        companyId: state.selectedCompanyId,
        transactionNumber: formData.transactionNumber,
        date: formData.date,
        type: formData.type,
        totalAmount: formData.totalAmount,
        description: formData.description,
        referenceNumber: formData.referenceNumber,
        lines: formData.lines
          .filter((line) => line.accountId && (line.debit || line.credit))
          .map((line) => ({
            id: crypto.randomUUID(),
            transactionId: "", // Will be set after creation
            accountId: line.accountId,
            debit: line.debit || "0",
            credit: line.credit || "0",
            description: line.description,
          })),
      });
      setShowCreateForm(false);
      setFormData({
        transactionNumber: "",
        date: new Date().toISOString().split("T")[0],
        type: "journal_entry",
        totalAmount: "",
        description: "",
        referenceNumber: "",
        lines: [
          { accountId: "", debit: "", credit: "", description: "" },
          { accountId: "", debit: "", credit: "", description: "" },
        ],
      });
    } catch (error) {
      // Error handled in context
    }
  };

  const addTransactionLine = () => {
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        { accountId: "", debit: "", credit: "", description: "" },
      ],
    });
  };

  const removeTransactionLine = (index: number) => {
    if (formData.lines.length > 2) {
      setFormData({
        ...formData,
        lines: formData.lines.filter((_, i) => i !== index),
      });
    }
  };

  const updateTransactionLine = (
    index: number,
    field: string,
    value: string,
  ) => {
    const updatedLines = [...formData.lines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    setFormData({ ...formData, lines: updatedLines });
  };

  return (
    <DashboardShell>
      <div className="container mx-auto max-w-7xl px-6 py-6">
        <div className="py-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="text-black"
            >
              Create Transaction
            </Button>
          </div>

          {state.error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{state.error}</div>
              <button
                onClick={clearError}
                className="ml-2 text-sm text-red-600 hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
          )}

          {showCreateForm && (
            <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border border-border-gray w-96 shadow-elevated rounded-md bg-surface1 max-h-screen overflow-y-auto">
                <div className="mt-3">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Create New Transaction
                  </h3>
                  {/* a11y: id + label + aria-describedby added for create transaction form fields */}
                  <form
                    onSubmit={handleCreateTransaction}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="transactions-form-transaction-number"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Transaction Number
                        </label>
                        <input
                          id="transactions-form-transaction-number"
                          type="text"
                          required
                          value={formData.transactionNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              transactionNumber: e.target.value,
                            })
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          aria-describedby="transactions-form-transaction-number-help"
                        />
                        <p
                          id="transactions-form-transaction-number-help"
                          className="sr-only"
                        >
                          Required unique transaction identifier.
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="transactions-form-date"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Date
                        </label>
                        <input
                          id="transactions-form-date"
                          type="date"
                          required
                          value={formData.date}
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          aria-describedby="transactions-form-date-help"
                        />
                        <p id="transactions-form-date-help" className="sr-only">
                          Transaction posting date.
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="transactions-form-type"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Type
                        </label>
                        <select
                          id="transactions-form-type"
                          value={formData.type}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
// @ts-ignore
// @ts-ignore
                              type: e.target.value as any,
                            })
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          aria-describedby="transactions-form-type-help"
                        >
                          <option value="journal_entry">Journal Entry</option>
                          <option value="invoice">Invoice</option>
                          <option value="payment">Payment</option>
                          <option value="bank">Bank</option>
                        </select>
                        <p id="transactions-form-type-help" className="sr-only">
                          Select the transaction type.
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="transactions-form-total-amount"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Total Amount
                        </label>
                        <input
                          id="transactions-form-total-amount"
                          type="number"
                          step="0.01"
                          required
                          value={formData.totalAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              totalAmount: e.target.value,
                            })
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          aria-describedby="transactions-form-total-amount-help"
                        />
                        <p
                          id="transactions-form-total-amount-help"
                          className="sr-only"
                        >
                          Enter the total monetary amount for this transaction.
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="transactions-form-reference-number"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Reference Number
                        </label>
                        <input
                          id="transactions-form-reference-number"
                          type="text"
                          value={formData.referenceNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              referenceNumber: e.target.value,
                            })
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          aria-describedby="transactions-form-reference-number-help"
                        />
                        <p
                          id="transactions-form-reference-number-help"
                          className="sr-only"
                        >
                          Optional external reference identifier.
                        </p>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="transactions-form-description"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Description
                      </label>
                      <textarea
                        id="transactions-form-description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        rows={3}
                        aria-describedby="transactions-form-description-help"
                      />
                      <p
                        id="transactions-form-description-help"
                        className="sr-only"
                      >
                        Optional description of this transaction.
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label
                          htmlFor="transactions-form-lines-description"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Transaction Lines
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addTransactionLine}
                        >
                          Add Line
                        </Button>
                      </div>
                      <p
                        id="transactions-form-lines-description"
                        className="sr-only"
                      >
                        Add one or more debit and credit lines with account and
                        description.
                      </p>
                      <div className="space-y-2">
                        {formData.lines.map((line, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 p-3 border rounded-md"
                          >
                            <div className="flex-1">
                              <label
                                htmlFor={`transactions-form-line-${index}-account`}
                                className="sr-only"
                              >
                                Account ID line {index + 1}
                              </label>
                              <input
                                id={`transactions-form-line-${index}-account`}
                                type="text"
                                placeholder="Account ID"
                                value={line.accountId}
                                onChange={(e) =>
                                  updateTransactionLine(
                                    index,
                                    "accountId",
                                    e.target.value,
                                  )
                                }
                                className="block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div className="w-24">
                              <label
                                htmlFor={`transactions-form-line-${index}-debit`}
                                className="sr-only"
                              >
                                Debit amount line {index + 1}
                              </label>
                              <input
                                id={`transactions-form-line-${index}-debit`}
                                type="number"
                                step="0.01"
                                placeholder="Debit"
                                value={line.debit}
                                onChange={(e) =>
                                  updateTransactionLine(
                                    index,
                                    "debit",
                                    e.target.value,
                                  )
                                }
                                className="block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div className="w-24">
                              <label
                                htmlFor={`transactions-form-line-${index}-credit`}
                                className="sr-only"
                              >
                                Credit amount line {index + 1}
                              </label>
                              <input
                                id={`transactions-form-line-${index}-credit`}
                                type="number"
                                step="0.01"
                                placeholder="Credit"
                                value={line.credit}
                                onChange={(e) =>
                                  updateTransactionLine(
                                    index,
                                    "credit",
                                    e.target.value,
                                  )
                                }
                                className="block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div className="flex-1">
                              <label
                                htmlFor={`transactions-form-line-${index}-description`}
                                className="sr-only"
                              >
                                Line description {index + 1}
                              </label>
                              <input
                                id={`transactions-form-line-${index}-description`}
                                type="text"
                                placeholder="Description"
                                value={line.description}
                                onChange={(e) =>
                                  updateTransactionLine(
                                    index,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                className="block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            {formData.lines.length > 2 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeTransactionLine(index)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={state.isLoading}
                        className="text-black"
                      >
                        {state.isLoading ? "Creating..." : "Create Transaction"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="bg-surface1 shadow-soft overflow-hidden sm:rounded-md border border-border-gray">
            {state.isLoading ? (
              <div className="px-4 py-8 text-center">
                <div className="text-gray-500">Loading transactions...</div>
              </div>
            ) : state.transactions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-gray-500">
                  No transactions found. Create your first transaction to get
                  started.
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {state.transactions.map((transaction) => (
                  <li key={transaction.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {transaction.transactionNumber}
                          </p>
                          <p className="ml-2 text-sm text-gray-900 truncate">
                            {transaction.description || "No description"}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.type === "journal_entry"
                                ? "bg-gray-100 text-gray-800"
                                : transaction.type === "invoice"
                                  ? "bg-blue-100 text-blue-800"
                                  : transaction.type === "payment"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {transaction.type}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            Amount: $
                            {parseFloat(transaction.totalAmount).toFixed(2)}
                          </span>
                        </div>
                        {transaction.lines && transaction.lines.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Lines:</p>
                            <div className="text-xs text-gray-600">
                              {transaction.lines.map((line, idx) => (
                                <span key={idx}>
                                  {line.debit &&
                                    `$${parseFloat(line.debit).toFixed(2)} debit`}
                                  {line.credit &&
                                    `$${parseFloat(line.credit).toFixed(2)} credit`}
                                  {idx < transaction.lines!.length - 1 && ", "}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default TransactionsPage;
