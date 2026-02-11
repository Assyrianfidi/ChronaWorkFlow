import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companiesService, type Company } from "@/services/companies.service";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { CompanyForm } from "./CompanyForm";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import type { CreateCompanyFormData } from "@/schemas/company.schema";

export function CompaniesList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["companies", page, search],
    queryFn: () => companiesService.getAll({ page, limit: 10, search }),
  });

  const createMutation = useMutation({
    mutationFn: companiesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company created successfully");
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create company");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      companiesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company updated successfully");
      setEditingCompany(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update company");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: companiesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete company");
    },
  });

  const handleCreate = (data: CreateCompanyFormData) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: CreateCompanyFormData) => {
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this company?")) {
      deleteMutation.mutate(id);
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">
          Error loading companies: {(error as Error).message}
        </p>
      </div>
    );
  }

  const companies = data?.data.data || [];
  const pagination = data?.data.pagination;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search companies by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Company
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No companies found. Create your first company to get started.
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      {company.name}
                    </TableCell>
                    <TableCell>
                      {company.industry ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {company.industry}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{company.email || "-"}</TableCell>
                    <TableCell>{company.phone || "-"}</TableCell>
                    <TableCell>
                      {new Date(company.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingCompany(company)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(company.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {companies.length} of {pagination.total} companies
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm">
                  Page {page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Add a new company to the system. All fields marked with * are
              required.
            </DialogDescription>
          </DialogHeader>
          <CompanyForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={createMutation.isPending}
            mode="create"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingCompany}
        onOpenChange={() => setEditingCompany(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>Update company information.</DialogDescription>
          </DialogHeader>
          {editingCompany && (
            <CompanyForm
              onSubmit={handleUpdate}
              onCancel={() => setEditingCompany(null)}
              defaultValues={{
                name: editingCompany.name,
                description: editingCompany.description,
                industry: editingCompany.industry,
                website: editingCompany.website,
                email: editingCompany.email,
                phone: editingCompany.phone,
              }}
              isLoading={updateMutation.isPending}
              mode="edit"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
