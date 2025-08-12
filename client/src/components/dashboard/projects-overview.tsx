import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { format } from "date-fns";

export default function ProjectsOverview() {
  const { data: projects = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/projects"],
    retry: false,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planning: { variant: "outline" as const, label: "Planning", className: "bg-blue-100 text-blue-800" },
      in_progress: { variant: "default" as const, label: "In Progress", className: "bg-yellow-100 text-yellow-800" },
      completed: { variant: "outline" as const, label: "Nearly Complete", className: "bg-green-100 text-green-800" },
      on_hold: { variant: "destructive" as const, label: "On Hold", className: "bg-red-100 text-red-800" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planning;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const getProgressPercentage = (status: string) => {
    const progressMap = {
      planning: 25,
      in_progress: 65,
      completed: 90,
      on_hold: 50,
    };
    return progressMap[status as keyof typeof progressMap] || 0;
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800">Current Projects</CardTitle>
          <Link href="/projects" className="text-primary font-medium hover:text-blue-700">
            Manage Projects
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 text-sm font-semibold text-slate-600">Project</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600">Client</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600">Workers</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600">Progress</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600">Due Date</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-4">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </td>
                      <td className="py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="py-4"><div className="h-8 bg-gray-200 rounded w-16"></div></td>
                      <td className="py-4">
                        <div className="space-y-2">
                          <div className="w-full bg-gray-200 rounded-full h-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-8"></div>
                        </div>
                      </td>
                      <td className="py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="py-4"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-3 text-sm font-semibold text-slate-600">Project</th>
                  <th className="pb-3 text-sm font-semibold text-slate-600">Client</th>
                  <th className="pb-3 text-sm font-semibold text-slate-600">Progress</th>
                  <th className="pb-3 text-sm font-semibold text-slate-600">Due Date</th>
                  <th className="pb-3 text-sm font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="space-y-4">
                {projects.slice(0, 5).map((project: any) => {
                  const progress = getProgressPercentage(project.status);
                  return (
                    <tr key={project.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-4">
                        <div>
                          <p className="font-medium text-slate-800">{project.name}</p>
                          <p className="text-sm text-slate-500">{project.description}</p>
                        </div>
                      </td>
                      <td className="py-4 text-slate-600">
                        {project.client?.name || "No Client"}
                      </td>
                      <td className="py-4">
                        <div className="space-y-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-accent h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-slate-600">{progress}%</span>
                        </div>
                      </td>
                      <td className="py-4 text-slate-600">
                        {project.dueDate ? format(new Date(project.dueDate), "MMM dd, yyyy") : "No due date"}
                      </td>
                      <td className="py-4">
                        {getStatusBadge(project.status)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500">No projects found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
