import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  client: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  project?: {
    name: string;
    description?: string;
  };
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
  notes?: string;
  lineItems: Array<{
    description: string;
    quantity: string;
    rate: string;
    amount: string;
  }>;
}

export const generateInvoicePDF = (invoice: InvoiceData, companyInfo?: {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
}) => {
  const doc = new jsPDF();
  
  // Company info (default if not provided)
  const company = {
    name: companyInfo?.name || 'Fidi WorkFlow Ledger',
    address: companyInfo?.address || '123 Business Street\nSuite 100\nBusiness City, BC 12345',
    phone: companyInfo?.phone || '(555) 123-4567',
    email: companyInfo?.email || 'info@fidiworkflow.com'
  };
  
  // Set up colors
  const primaryColor = [41, 128, 185]; // Blue
  const secondaryColor = [52, 73, 94]; // Dark gray
  const lightGray = [236, 240, 241];
  
  // Header - Company Info
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(company.name, 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const companyLines = company.address.split('\n');
  let yPos = 32;
  companyLines.forEach(line => {
    doc.text(line, 20, yPos);
    yPos += 4;
  });
  
  // Invoice title and number
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 150, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 150, 35);
  
  // Invoice details box
  const startY = 50;
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(20, startY, 170, 35, 'F');
  
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  
  // Left column
  doc.text('Bill To:', 25, startY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.client.name, 25, startY + 15);
  if (invoice.client.email) doc.text(invoice.client.email, 25, startY + 21);
  if (invoice.client.phone) doc.text(invoice.client.phone, 25, startY + 27);
  
  // Right column
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date:', 120, startY + 8);
  doc.text('Due Date:', 120, startY + 15);
  doc.text('Status:', 120, startY + 22);
  if (invoice.project) doc.text('Project:', 120, startY + 29);
  
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(invoice.issueDate), 'MMM dd, yyyy'), 155, startY + 8);
  doc.text(format(new Date(invoice.dueDate), 'MMM dd, yyyy'), 155, startY + 15);
  
  // Status with color coding
  const statusColors: { [key: string]: number[] } = {
    draft: [149, 165, 166],
    sent: [52, 152, 219],
    paid: [46, 204, 113],
    overdue: [231, 76, 60],
    cancelled: [149, 165, 166]
  };
  const statusColor = statusColors[invoice.status] || statusColors.draft;
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.status.toUpperCase(), 155, startY + 22);
  
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'normal');
  if (invoice.project) doc.text(invoice.project.name, 155, startY + 29);
  
  // Line items table
  const tableStartY = startY + 45;
  
  const tableData = invoice.lineItems.map(item => [
    item.description,
    parseFloat(item.quantity).toFixed(2),
    `$${parseFloat(item.rate).toFixed(2)}`,
    `$${parseFloat(item.amount).toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Quantity', 'Rate', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]] as [number, number, number],
      textColor: 255,
      fontSize: 11,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [secondaryColor[0], secondaryColor[1], secondaryColor[2]] as [number, number, number]
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });
  
  // Totals section
  const finalY = (doc as any).lastAutoTable?.finalY + 10 || tableStartY + 50;
  const totalsX = 130;
  
  doc.setFontSize(11);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  
  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, finalY);
  doc.text(`$${parseFloat(invoice.subtotal).toFixed(2)}`, 180, finalY, { align: 'right' });
  
  // Discount
  if (parseFloat(invoice.discountAmount) > 0) {
    doc.text('Discount:', totalsX, finalY + 7);
    doc.text(`-$${parseFloat(invoice.discountAmount).toFixed(2)}`, 180, finalY + 7, { align: 'right' });
  }
  
  // Tax
  const taxY = parseFloat(invoice.discountAmount) > 0 ? finalY + 14 : finalY + 7;
  doc.text(`Tax (${parseFloat(invoice.taxRate).toFixed(1)}%):`, totalsX, taxY);
  doc.text(`$${parseFloat(invoice.taxAmount).toFixed(2)}`, 180, taxY, { align: 'right' });
  
  // Total
  const totalY = taxY + 7;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(totalsX - 5, totalY - 2, 185, totalY - 2);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Total:', totalsX, totalY + 3);
  doc.text(`$${parseFloat(invoice.total).toFixed(2)}`, 180, totalY + 3, { align: 'right' });
  
  // Notes section
  if (invoice.notes) {
    const notesY = totalY + 20;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, notesY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitNotes = doc.splitTextToSize(invoice.notes, 170);
    doc.text(splitNotes, 20, notesY + 7);
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business!', 105, pageHeight - 30, { align: 'center' });
  doc.text(`${company.phone} | ${company.email}`, 105, pageHeight - 20, { align: 'center' });
  
  return doc;
};

export const downloadInvoicePDF = (invoice: InvoiceData, companyInfo?: any) => {
  const doc = generateInvoicePDF(invoice, companyInfo);
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
};

export const previewInvoicePDF = (invoice: InvoiceData, companyInfo?: any) => {
  const doc = generateInvoicePDF(invoice, companyInfo);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};