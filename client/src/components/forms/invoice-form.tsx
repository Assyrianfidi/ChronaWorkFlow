import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertInvoiceSchema, insertInvoiceLineItemSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { format } from "date-fns";

const invoiceFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  projectId: z.string().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  issueDate: z.string(),
  dueDate: z.string(),
  subtotal: z.string(),
  taxRate: z.string().optional(),
  taxAmount: z.number().optional().default(0),
  discountAmount: z.string().optional(),
  total: z.number().optional().default(0),
  notes: z.string().optional(),
  lineItems: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.string(),
    rate: z.string(),
    amount: z.number(),
    sortOrder: z.number().optional().default(0),
  })).min(1, "At least one line item is required"),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  invoice?: any | null;
  onSuccess: () => void;
}

export default function InvoiceForm({ invoice, onSuccess }: InvoiceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
    retry: false,
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: invoice?.clientId || "",
      projectId: invoice?.projectId || "",
      status: invoice?.status || "draft",
      issueDate: invoice?.issueDate ? format(new Date(invoice.issueDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      dueDate: invoice?.dueDate ? format(new Date(invoice.dueDate), "yyyy-MM-dd") : format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      subtotal: invoice?.subtotal?.toString() || "0",
      taxRate: invoice?.taxRate?.toString() || "0",
      taxAmount: invoice?.taxAmount || 0,
      discountAmount: invoice?.discountAmount?.toString() || "0",
      total: invoice?.total || 0,
      notes: invoice?.notes || "",
      lineItems: invoice?.lineItems?.map((item: any) => ({
        description: item.description || "",
        quantity: item.quantity?.toString() || "1",
        rate: item.rate?.toString() || "0",
        amount: parseFloat(item.amount) || 0,
        sortOrder: item.sortOrder || 0,
      })) || [
        { description: "", quantity: "1", rate: "0", amount: 0, sortOrder: 0 }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const watchedLineItems = form.watch("lineItems");
  const watchedTaxRate = form.watch("taxRate");
  const watchedDiscountAmount = form.watch("discountAmount");

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = watchedLineItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return sum + (quantity * rate);
    }, 0);

    const taxRate = parseFloat(watchedTaxRate || "0") || 0;
    const discountAmount = parseFloat(watchedDiscountAmount || "0") || 0;
    const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
    const total = subtotal - discountAmount + taxAmount;

    form.setValue("subtotal", subtotal.toString());
    form.setValue("taxAmount", taxAmount);
    form.setValue("total", total);

    // Update line item amounts
    watchedLineItems.forEach((item, index) => {
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = quantity * rate;
      form.setValue(`lineItems.${index}.amount`, amount);
    });
  };

  // Recalculate when line items or tax/discount change
  React.useEffect(() => {
    calculateTotals();
  }, [watchedLineItems, watchedTaxRate, watchedDiscountAmount]);

  const mutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      // Transform data for backend - all decimals as strings for Drizzle
      const transformedData = {
        clientId: data.clientId,
        projectId: data.projectId === "none" || !data.projectId ? null : data.projectId,
        status: data.status,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        subtotal: (parseFloat(data.subtotal) || 0).toString(),
        taxRate: (parseFloat(data.taxRate || "0")).toString(),
        taxAmount: (data.taxAmount || 0).toString(),
        discountAmount: (parseFloat(data.discountAmount || "0")).toString(),
        total: (data.total || 0).toString(),
        notes: data.notes || null,
        lineItems: data.lineItems.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: (parseFloat(item.quantity || "1") * parseFloat(item.rate || "0")).toString(),
          sortOrder: index,
        })),
      };
      
      console.log("Sending to backend:", transformedData);
      
      const url = invoice ? `/api/invoices/${invoice.id}` : "/api/invoices";
      const method = invoice ? "PUT" : "POST";
      const response = await apiRequest(method, url, transformedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: `Invoice ${invoice ? "updated" : "created"} successfully`,
      });
      onSuccess();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: `Failed to ${invoice ? "update" : "create"} invoice`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvoiceFormData) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Project</SelectItem>
                        {projects.map((project: any) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: "", quantity: "1", rate: "0", amount: 0, sortOrder: fields.length })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          {index === 0 && <FormLabel>Description</FormLabel>}
                          <FormControl>
                            <Input placeholder="Description of work..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          {index === 0 && <FormLabel>Qty</FormLabel>}
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.rate`}
                      render={({ field }) => (
                        <FormItem>
                          {index === 0 && <FormLabel>Rate ($)</FormLabel>}
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    {index === 0 && <div className="text-sm font-medium mb-2">Amount</div>}
                    <div className="flex items-center h-10 px-3 py-2 border border-input bg-muted rounded-md text-sm">
                      ${(parseFloat(watchedLineItems[index]?.quantity || "0") * parseFloat(watchedLineItems[index]?.rate || "0")).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="col-span-1">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discountAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Amount ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t pt-4 space-y-2 text-right">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${form.watch("subtotal") ? parseFloat(form.watch("subtotal")).toFixed(2) : "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-${parseFloat(watchedDiscountAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${form.watch("taxAmount")?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${form.watch("total")?.toFixed(2) || "0.00"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional notes for this invoice..."
                  className="resize-none"
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="bg-primary hover:bg-blue-700"
          >
            {mutation.isPending ? "Saving..." : (invoice ? "Update Invoice" : "Create Invoice")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
