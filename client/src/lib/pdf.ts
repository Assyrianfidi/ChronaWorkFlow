// PDF generation utilities for invoices and reports
// In a real application, you would use a library like jsPDF or react-pdf

export interface InvoiceData {
  invoiceNumber: string;
  client: {
    name: string;
    email?: string;
    address?: string;
  };
  project?: {
    name: string;
  };
  issueDate: string;
  dueDate: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes?: string;
}

export const generateInvoicePDF = (invoiceData: InvoiceData): void => {
  // Create a simple HTML document for PDF generation
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoiceData.invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
          color: #333;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #2563EB;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563EB;
        }
        .invoice-title {
          font-size: 32px;
          font-weight: bold;
          color: #2563EB;
        }
        .invoice-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .client-info, .invoice-info {
          flex: 1;
        }
        .invoice-info {
          text-align: right;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f8fafc;
          font-weight: bold;
        }
        .amount {
          text-align: right;
        }
        .totals {
          margin-left: auto;
          width: 300px;
        }
        .totals tr td {
          padding: 8px 0;
        }
        .total-row {
          font-weight: bold;
          font-size: 18px;
          border-top: 2px solid #333;
        }
        .notes {
          margin-top: 30px;
          padding: 20px;
          background-color: #f8fafc;
          border-left: 4px solid #2563EB;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Fidi WorkFlow Ledger</div>
        <div class="invoice-title">INVOICE</div>
      </div>

      <div class="invoice-details">
        <div class="client-info">
          <h3>Bill To:</h3>
          <p><strong>${invoiceData.client.name}</strong></p>
          ${invoiceData.client.email ? `<p>${invoiceData.client.email}</p>` : ''}
          ${invoiceData.client.address ? `<p>${invoiceData.client.address}</p>` : ''}
        </div>
        
        <div class="invoice-info">
          <p><strong>Invoice #:</strong> ${invoiceData.invoiceNumber}</p>
          <p><strong>Issue Date:</strong> ${new Date(invoiceData.issueDate).toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString()}</p>
          ${invoiceData.project ? `<p><strong>Project:</strong> ${invoiceData.project.name}</p>` : ''}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 50%">Description</th>
            <th style="width: 15%">Quantity</th>
            <th style="width: 15%">Rate</th>
            <th style="width: 20%" class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceData.lineItems.map(item => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>$${item.rate.toFixed(2)}</td>
              <td class="amount">$${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <table class="totals">
        <tr>
          <td>Subtotal:</td>
          <td class="amount">$${invoiceData.subtotal.toFixed(2)}</td>
        </tr>
        ${invoiceData.discountAmount > 0 ? `
        <tr>
          <td>Discount:</td>
          <td class="amount">-$${invoiceData.discountAmount.toFixed(2)}</td>
        </tr>
        ` : ''}
        <tr>
          <td>Tax (${invoiceData.taxRate}%):</td>
          <td class="amount">$${invoiceData.taxAmount.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td>Total:</td>
          <td class="amount">$${invoiceData.total.toFixed(2)}</td>
        </tr>
      </table>

      ${invoiceData.notes ? `
      <div class="notes">
        <h4>Notes:</h4>
        <p>${invoiceData.notes}</p>
      </div>
      ` : ''}

      <div style="margin-top: 50px; text-align: center; color: #666; font-size: 12px;">
        <p>Thank you for your business!</p>
        <p>Generated by Fidi WorkFlow Ledger on ${new Date().toLocaleDateString()}</p>
      </div>
    </body>
    </html>
  `;

  // Create a new window and print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
};

export const downloadInvoicePDF = (invoiceData: InvoiceData): void => {
  // For a real implementation, you would use a proper PDF library
  // This is a simplified version that opens the print dialog
  generateInvoicePDF(invoiceData);
};

export interface TimeLogReport {
  worker: {
    firstName: string;
    lastName: string;
  };
  project?: {
    name: string;
  };
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  date: string;
}

export const generateTimeLogReport = (timeLogs: TimeLogReport[], startDate: string, endDate: string): void => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Time Log Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2563EB;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563EB;
        }
        .report-title {
          font-size: 28px;
          font-weight: bold;
          margin: 10px 0;
        }
        .date-range {
          font-size: 16px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f8fafc;
          font-weight: bold;
        }
        .center {
          text-align: center;
        }
        .summary {
          margin-top: 30px;
          padding: 20px;
          background-color: #f8fafc;
          border-left: 4px solid #2563EB;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Fidi WorkFlow Ledger</div>
        <div class="report-title">Time Log Report</div>
        <div class="date-range">${startDate} to ${endDate}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Worker</th>
            <th>Project</th>
            <th>Date</th>
            <th>Clock In</th>
            <th>Clock Out</th>
            <th>Hours</th>
          </tr>
        </thead>
        <tbody>
          ${timeLogs.map(log => `
            <tr>
              <td>${log.worker.firstName} ${log.worker.lastName}</td>
              <td>${log.project?.name || 'No Project'}</td>
              <td>${new Date(log.date).toLocaleDateString()}</td>
              <td>${new Date(log.clockIn).toLocaleTimeString()}</td>
              <td>${log.clockOut ? new Date(log.clockOut).toLocaleTimeString() : 'Active'}</td>
              <td>${log.totalHours ? `${log.totalHours}h` : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="summary">
        <h4>Summary:</h4>
        <p>Total Records: ${timeLogs.length}</p>
        <p>Total Hours: ${timeLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0).toFixed(2)}h</p>
        <p>Active Sessions: ${timeLogs.filter(log => !log.clockOut).length}</p>
      </div>

      <div style="margin-top: 50px; text-align: center; color: #666; font-size: 12px;">
        <p>Generated by Fidi WorkFlow Ledger on ${new Date().toLocaleDateString()}</p>
      </div>
    </body>
    </html>
  `;

  // Create a new window and print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
};
