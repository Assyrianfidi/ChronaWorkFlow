import { PrismaClientSingleton } from '../lib/prisma';
const prisma = PrismaClientSingleton.getInstance();

export async function generateInvoiceNumber(): Promise<string> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    // Get the latest invoice number for this month
    const latestInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: `INV-${year}${month}`,
        },
      },
      orderBy: {
        invoiceNumber: "desc",
      },
    });

    let sequence = 1;

    if (latestInvoice) {
      // Extract sequence number from existing invoice
      const parts = latestInvoice.invoiceNumber.split("-");
      if (parts.length >= 3) {
        const lastSequence = parseInt(parts[2]);
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }
    }

    // Format: INV-YYYYMM-0001
    const invoiceNumber = `INV-${year}${month}-${String(sequence).padStart(4, "0")}`;

    return invoiceNumber;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    // Fallback to timestamp-based number
    const timestamp = Date.now();
    return `INV-${timestamp}`;
  }
}
