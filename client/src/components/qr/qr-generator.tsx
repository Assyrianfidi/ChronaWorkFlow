import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import QRCode from "qrcode";

interface QRGeneratorProps {
  value: string;
  workerName: string;
  size?: number;
}

export default function QRGenerator({ value, workerName, size = 200 }: QRGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateQRCode();
  }, [value, size]);

  const generateQRCode = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Generate real QR code using qrcode library
      await QRCode.toCanvas(canvas, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      
      // Fallback: draw error message
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = size;
        canvas.height = size;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#FF0000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code Error', size / 2, size / 2);
      }
    }
  };

  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${workerName.replace(/\s+/g, '_')}_QR.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const printQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const img = new Image();
    img.onload = () => {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - ${workerName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              margin: 20px;
            }
            .qr-container { 
              display: inline-block; 
              border: 1px solid #ccc; 
              padding: 20px; 
              margin: 20px;
            }
            h2 { margin: 10px 0; }
            .worker-name { font-size: 18px; font-weight: bold; }
            .qr-code { margin: 10px 0; }
            .instructions { 
              font-size: 12px; 
              color: #666; 
              margin-top: 10px; 
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>Chrona Workflow</h2>
            <div class="worker-name">${workerName}</div>
            <div class="qr-code">
              <img src="${img.src}" alt="QR Code" style="max-width: 200px;" />
            </div>
            <div class="instructions">
              Scan this QR code to clock in/out
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    };
    img.src = canvas.toDataURL();
  };

  return (
    <div className="space-y-4 text-center">
      <div className="bg-white p-4 rounded-lg border inline-block">
        <canvas
          ref={canvasRef}
          className="border rounded"
        />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-slate-600">QR Code: {value}</p>
        <div className="flex justify-center space-x-2">
          <Button onClick={downloadQR} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={printQR} variant="outline" size="sm">
            Print
          </Button>
        </div>
      </div>
    </div>
  );
}
