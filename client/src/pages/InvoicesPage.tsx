import * as React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Send, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  amount: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  dueDate: string
  createdAt: string
  description?: string
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-001',
    customerName: 'ABC Corporation',
    customerEmail: 'billing@abc-corp.com',
    amount: 2500.00,
    status: 'PAID',
    dueDate: '2024-12-15',
    createdAt: '2024-12-01',
    description: 'Web development services - November 2024'
  },
  {
    id: '2',
    invoiceNumber: 'INV-002',
    customerName: 'XYZ Industries',
    customerEmail: 'accounts@xyz-ind.com',
    amount: 1800.50,
    status: 'SENT',
    dueDate: '2024-12-20',
    createdAt: '2024-12-05',
    description: 'SEO consulting services'
  },
  {
    id: '3',
    invoiceNumber: 'INV-003',
    customerName: 'Tech Solutions Ltd',
    customerEmail: 'finance@tech-solutions.io',
    amount: 3200.00,
    status: 'OVERDUE',
    dueDate: '2024-11-30',
    createdAt: '2024-11-15',
    description: 'Cloud infrastructure setup'
  },
  {
    id: '4',
    invoiceNumber: 'INV-004',
    customerName: 'Global Marketing Inc',
    customerEmail: 'payments@global-marketing.com',
    amount: 950.00,
    status: 'DRAFT',
    dueDate: '2024-12-25',
    createdAt: '2024-12-10',
    description: 'Marketing campaign management'
  },
  {
    id: '5',
    invoiceNumber: 'INV-005',
    customerName: 'StartUp Ventures',
    customerEmail: 'admin@startup-ventures.co',
    amount: 1500.00,
    status: 'SENT',
    dueDate: '2024-12-18',
    createdAt: '2024-12-08',
    description: 'Mobile app development consultation'
  }
]

const statusConfig = {
  DRAFT: { color: 'bg-gray-100 text-gray-800', icon: Edit, label: 'Draft' },
  SENT: { color: 'bg-blue-100 text-blue-800', icon: Send, label: 'Sent' },
  PAID: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Paid' },
  OVERDUE: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Overdue' },
  CANCELLED: { color: 'bg-yellow-100 text-yellow-800', icon: Trash2, label: 'Cancelled' }
}

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices)
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>(mockInvoices)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Mock fetch invoices
  const fetchInvoices = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      console.log('📄 Fetching invoices...')
      // In real app: const response = await fetch('/api/invoices')
      setInvoices(mockInvoices)
      setFilteredInvoices(mockInvoices)
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  // Filter invoices
  useEffect(() => {
    let filtered = invoices

    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    setFilteredInvoices(filtered)
  }, [invoices, searchTerm, statusFilter])

  const handleCreateInvoice = async (formData: any) => {
    try {
      console.log('📄 Creating invoice:', formData)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newInvoice: Invoice = {
        id: Date.now().toString(),
        invoiceNumber: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        amount: parseFloat(formData.amount),
        status: 'DRAFT',
        dueDate: formData.dueDate,
        createdAt: new Date().toISOString().split('T')[0],
        description: formData.description
      }

      setInvoices([newInvoice, ...invoices])
      setIsCreateDialogOpen(false)
      console.log('✅ Invoice created successfully')
    } catch (error) {
      console.error('Failed to create invoice:', error)
    }
  }

  const handleUpdateStatus = async (invoiceId: string, newStatus: Invoice['status']) => {
    try {
      console.log('📄 Updating invoice status:', invoiceId, newStatus)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setInvoices(invoices.map(invoice =>
        invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
      ))
      console.log('✅ Invoice status updated successfully')
    } catch (error) {
      console.error('Failed to update invoice status:', error)
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    
    try {
      console.log('📄 Deleting invoice:', invoiceId)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setInvoices(invoices.filter(invoice => invoice.id !== invoiceId))
      console.log('✅ Invoice deleted successfully')
    } catch (error) {
      console.error('Failed to delete invoice:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-gray-600">Manage and track customer invoices</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-enterprise-navy hover:bg-enterprise-navy/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Create a new invoice for a customer.
              </DialogDescription>
            </DialogHeader>
            <CreateInvoiceForm onSubmit={handleCreateInvoice} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">All time invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {invoices.filter(i => i.status === 'PAID').length}
            </div>
            <p className="text-xs text-muted-foreground">Paid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {invoices.filter(i => i.status === 'SENT').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {invoices.filter(i => i.status === 'OVERDUE').length}
            </div>
            <p className="text-xs text-muted-foreground">Overdue invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
          <CardDescription>
            A list of all invoices including their status and payment information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-enterprise-navy"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const StatusIcon = statusConfig[invoice.status].icon
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.customerName}</div>
                          <div className="text-sm text-gray-500">{invoice.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={statusConfig[invoice.status].color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[invoice.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell>{invoice.createdAt}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          {invoice.status === 'SENT' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUpdateStatus(invoice.id, 'PAID')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Create Invoice Form Component
const CreateInvoiceForm: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    amount: '',
    dueDate: '',
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.customerName || !formData.customerEmail || !formData.amount || !formData.dueDate) {
      alert('Please fill in all required fields')
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name *</Label>
          <Input
            id="customerName"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            placeholder="Enter customer name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerEmail">Customer Email *</Label>
          <Input
            id="customerEmail"
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            placeholder="customer@example.com"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter invoice description"
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit" className="bg-enterprise-navy hover:bg-enterprise-navy/90">
          Create Invoice
        </Button>
      </div>
    </form>
  )
}

export default InvoicesPage
