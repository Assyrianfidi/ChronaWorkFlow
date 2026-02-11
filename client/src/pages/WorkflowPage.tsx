import React, { useState } from "react";
import { Play, Clock, CheckCircle, XCircle } from "lucide-react";
import api from "@/api";

interface WorkflowInstance {
  id: string;
  workflowDefinitionId: string;
  status: "pending" | "running" | "completed" | "failed";
  triggerEventType: string;
  triggerEntityId: string;
  startedAt: string;
  completedAt?: string;
  currentStep?: string;
}

const WorkflowPage: React.FC = () => {
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setLoading(true);
    api
      .get("/workflow/instances")
      .then((res) => setInstances(res.data))
      .catch(() => setInstances([]))
      .finally(() => setLoading(false));
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-gray-500" />;
      case "running":
        return <Play className="w-4 h-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Workflow Instances</h1>
      {loading ? (
        <p>Loading workflows...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trigger
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Current Step
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {instances.map((instance) => (
                <tr key={instance.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {instance.triggerEventType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {instance.triggerEntityId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-2">
                    {getStatusIcon(instance.status)}
                    <span className="capitalize">{instance.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(instance.startedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {instance.completedAt
                      ? new Date(instance.completedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {instance.currentStep ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {instances.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>No workflow instances found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkflowPage;
