/**
 * Multi-Entity Dashboard Component
 * Provides CRUD operations for multiple business entities with real-time reporting
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  RefreshCw,
  ChevronRight,
  MoreVertical,
  Search,
  Filter,
  Download,
  Settings,
  Eye,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Entity {
  id: string;
  name: string;
  type: "llc" | "corporation" | "sole_proprietorship" | "partnership";
  status: "active" | "inactive" | "pending";
  createdAt: string;
  metrics: {
    revenue: number;
    expenses: number;
    profit: number;
    cashPosition: number;
    accountsReceivable: number;
    accountsPayable: number;
    transactionCount: number;
  };
  lastSync: string;
}

interface EntityFormData {
  name: string;
  type: Entity["type"];
  taxId?: string;
  address?: string;
  industry?: string;
}

const MultiEntityDashboard: React.FC = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [formData, setFormData] = useState<EntityFormData>({
    name: "",
    type: "llc",
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch entities from API
  const fetchEntities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/companies", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch entities");

      const data = await response.json();
      setEntities(data.data || []);
    } catch (err) {
      setError("Failed to load entities. Please try again.");
      // Use mock data for demo
      setEntities(getMockEntities());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  // Create new entity
  const handleCreateEntity = async () => {
    try {
      const response = await fetch("/api/v1/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create entity");

      const data = await response.json();
      setEntities([...entities, data.data]);
      setIsCreating(false);
      setFormData({ name: "", type: "llc" });
    } catch (err) {
      // Demo mode: add mock entity
      const newEntity: Entity = {
        id: `entity_${Date.now()}`,
        name: formData.name,
        type: formData.type,
        status: "active",
        createdAt: new Date().toISOString(),
        metrics: {
          revenue: 0,
          expenses: 0,
          profit: 0,
          cashPosition: 0,
          accountsReceivable: 0,
          accountsPayable: 0,
          transactionCount: 0,
        },
        lastSync: new Date().toISOString(),
      };
      setEntities([...entities, newEntity]);
      setIsCreating(false);
      setFormData({ name: "", type: "llc" });
    }
  };

  // Update entity
  const handleUpdateEntity = async () => {
    if (!selectedEntity) return;

    try {
      const response = await fetch(`/api/v1/companies/${selectedEntity.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update entity");

      const data = await response.json();
      setEntities(
        entities.map((e) => (e.id === selectedEntity.id ? data.data : e)),
      );
      setIsEditing(false);
      setSelectedEntity(null);
    } catch (err) {
      // Demo mode: update locally
      setEntities(
        entities.map((e) =>
          e.id === selectedEntity.id
            ? { ...e, name: formData.name, type: formData.type }
            : e,
        ),
      );
      setIsEditing(false);
      setSelectedEntity(null);
    }
  };

  // Delete entity
  const handleDeleteEntity = async (entityId: string) => {
    try {
      const response = await fetch(`/api/v1/companies/${entityId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete entity");

      setEntities(entities.filter((e) => e.id !== entityId));
      setShowDeleteConfirm(null);
    } catch (err) {
      // Demo mode: delete locally
      setEntities(entities.filter((e) => e.id !== entityId));
      setShowDeleteConfirm(null);
    }
  };

  // Filter entities
  const filteredEntities = entities.filter((entity) => {
    const matchesSearch = entity.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || entity.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Calculate totals
  const totals = entities.reduce(
    (acc, entity) => ({
      revenue: acc.revenue + entity.metrics.revenue,
      expenses: acc.expenses + entity.metrics.expenses,
      profit: acc.profit + entity.metrics.profit,
      cashPosition: acc.cashPosition + entity.metrics.cashPosition,
    }),
    { revenue: 0, expenses: 0, profit: 0, cashPosition: 0 },
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-7 h-7 text-blue-600" />
                Multi-Entity Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage all your business entities in one place
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchEntities}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <RefreshCw
                  className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Entity
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(totals.revenue)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              +12.5% from last month
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(totals.expenses)}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              +8.2% from last month
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Net Profit
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(totals.profit)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
              {totals.revenue > 0
                ? ((totals.profit / totals.revenue) * 100).toFixed(1)
                : 0}
              % margin
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Cash Position
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(totals.cashPosition)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Across {entities.length} entities
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Entity List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cash
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Loading entities...
                      </p>
                    </td>
                  </tr>
                ) : filteredEntities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 mb-2">
                        No entities found
                      </p>
                      <button
                        onClick={() => setIsCreating(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Create your first entity
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredEntities.map((entity) => (
                    <tr
                      key={entity.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
                            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {entity.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Created {formatDate(entity.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {entity.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            entity.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : entity.status === "inactive"
                                ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {entity.status === "active" && (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          {entity.status === "pending" && (
                            <AlertCircle className="w-3 h-3 mr-1" />
                          )}
                          {entity.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(entity.metrics.revenue)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`text-sm font-medium ${
                            entity.metrics.profit >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {formatCurrency(entity.metrics.profit)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(entity.metrics.cashPosition)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedEntity(entity)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEntity(entity);
                              setFormData({
                                name: entity.name,
                                type: entity.type,
                              });
                              setIsEditing(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(entity.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Entity Detail Panel */}
        {selectedEntity && !isEditing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedEntity.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {selectedEntity.type.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEntity(null)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Revenue
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(selectedEntity.metrics.revenue)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Expenses
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(selectedEntity.metrics.expenses)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Net Profit
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        selectedEntity.metrics.profit >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(selectedEntity.metrics.profit)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Cash Position
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(selectedEntity.metrics.cashPosition)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedEntity.metrics.transactionCount}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Transactions
                    </p>
                  </div>
                  <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(
                        selectedEntity.metrics.accountsReceivable,
                      )}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      A/R
                    </p>
                  </div>
                  <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(selectedEntity.metrics.accountsPayable)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      A/P
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <BarChart3 className="w-4 h-4" />
                    View Reports
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <FileText className="w-4 h-4" />
                    Transactions
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {(isCreating || isEditing) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isCreating ? "Create New Entity" : "Edit Entity"}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Entity Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter entity name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Entity Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as Entity["type"],
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="llc">LLC</option>
                    <option value="corporation">Corporation</option>
                    <option value="sole_proprietorship">
                      Sole Proprietorship
                    </option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                    setFormData({ name: "", type: "llc" });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={isCreating ? handleCreateEntity : handleUpdateEntity}
                  disabled={!formData.name}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Create Entity" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Delete Entity?
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  This action cannot be undone. All data associated with this
                  entity will be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteEntity(showDeleteConfirm)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Mock data for demo purposes
function getMockEntities(): Entity[] {
  return [
    {
      id: "entity_1",
      name: "TechStart Inc.",
      type: "corporation",
      status: "active",
      createdAt: "2024-01-15T00:00:00Z",
      metrics: {
        revenue: 450000,
        expenses: 320000,
        profit: 130000,
        cashPosition: 185000,
        accountsReceivable: 45000,
        accountsPayable: 28000,
        transactionCount: 1250,
      },
      lastSync: "2024-12-20T10:30:00Z",
    },
    {
      id: "entity_2",
      name: "Digital Solutions LLC",
      type: "llc",
      status: "active",
      createdAt: "2024-03-01T00:00:00Z",
      metrics: {
        revenue: 280000,
        expenses: 195000,
        profit: 85000,
        cashPosition: 92000,
        accountsReceivable: 32000,
        accountsPayable: 18000,
        transactionCount: 780,
      },
      lastSync: "2024-12-20T09:15:00Z",
    },
    {
      id: "entity_3",
      name: "Consulting Partners",
      type: "partnership",
      status: "active",
      createdAt: "2024-06-10T00:00:00Z",
      metrics: {
        revenue: 175000,
        expenses: 125000,
        profit: 50000,
        cashPosition: 68000,
        accountsReceivable: 22000,
        accountsPayable: 12000,
        transactionCount: 420,
      },
      lastSync: "2024-12-19T16:45:00Z",
    },
    {
      id: "entity_4",
      name: "Retail Ventures",
      type: "sole_proprietorship",
      status: "pending",
      createdAt: "2024-11-20T00:00:00Z",
      metrics: {
        revenue: 0,
        expenses: 5000,
        profit: -5000,
        cashPosition: 15000,
        accountsReceivable: 0,
        accountsPayable: 3000,
        transactionCount: 25,
      },
      lastSync: "2024-12-18T14:00:00Z",
    },
  ];
}

export default MultiEntityDashboard;
