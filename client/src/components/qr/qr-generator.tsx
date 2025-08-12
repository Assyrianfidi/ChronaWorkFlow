import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

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

  const generateQRCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Simple QR code representation (black and white squares)
    // In a real application, you would use a QR code library like qrcode-generator
    // For now, we'll create a simple pattern based on the value
    const gridSize = 20;
    const cellSize = size / gridSize;
    
    ctx.fillStyle = '#000000';
    
    // Create a pseudo-random pattern based on the value
    const seed = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    let rng = seed;
    
    const random = () => {
      rng = (rng * 1103515245 + 12345) & 0x7fffffff;
      return rng / 0x7fffffff;
    };

    // Draw QR code pattern
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Create finder patterns (corners)
        const isFinderPattern = 
          (row < 7 && col < 7) || 
          (row < 7 && col >= gridSize - 7) || 
          (row >= gridSize - 7 && col < 7);
        
        if (isFinderPattern) {
          // Draw finder pattern
          const isOuter = row === 0 || row === 6 || col === 0 || col === 6 ||
                          (row === 1 && (col === 1 || col === 5)) ||
                          (row === 5 && (col === 1 || col === 5));
          const isInner = (row >= 2 && row <= 4 && col >= 2 && col <= 4);
          
          if (isOuter || isInner) {
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
          }
        } else {
          // Random data pattern
          if (random() > 0.5) {
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    // Draw border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, size, size);
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
            <h2>Fidi WorkFlow Ledger</h2>
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
