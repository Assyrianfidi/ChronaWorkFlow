import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";

interface QRScannerProps {
  onScan: (qrCode: string) => void;
  isLoading?: boolean;
}

export default function QRScanner({ onScan, isLoading }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera if available
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
        
        // Start scanning for QR codes
        intervalRef.current = setInterval(scanForQRCode, 500);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsScanning(false);
  };

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simple QR code detection (in a real app, you'd use a QR code library like jsQR)
    // For demo purposes, we'll simulate QR code detection by looking for worker patterns
    // In production, you would use: import jsQR from 'jsqr';
    // const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    // Simulate QR code detection for demo
    if (Math.random() < 0.1) { // 10% chance to "detect" a code for demo
      const mockQRCode = `WORKER_${Math.random().toString(36).substring(7).toUpperCase()}`;
      onScan(mockQRCode);
      stopCamera();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 rounded-lg p-8 text-center relative overflow-hidden">
        {isScanning ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-w-sm mx-auto rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 border-2 border-primary rounded-lg opacity-50"></div>
            <p className="text-sm text-slate-600 mt-4">Point camera at QR code</p>
          </>
        ) : (
          <>
            <Camera className="text-4xl text-slate-400 mb-4 mx-auto" />
            <p className="text-slate-600 mb-4">Click to start camera and scan QR code</p>
          </>
        )}
        
        {error && (
          <div className="text-red-600 text-sm mt-2 p-2 bg-red-50 rounded">
            {error}
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-2">
        {!isScanning ? (
          <Button
            onClick={startCamera}
            disabled={isLoading}
            className="bg-primary hover:bg-blue-700"
          >
            <Camera className="h-4 w-4 mr-2" />
            Start Camera
          </Button>
        ) : (
          <Button
            onClick={stopCamera}
            variant="outline"
            disabled={isLoading}
          >
            <CameraOff className="h-4 w-4 mr-2" />
            Stop Camera
          </Button>
        )}
      </div>

      {/* Manual QR Code Input for Testing */}
      <div className="border-t pt-4">
        <p className="text-sm text-slate-600 mb-2">For testing, you can manually enter a QR code:</p>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter QR code (e.g., WORKER_ABC123)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                if (target.value.trim()) {
                  onScan(target.value.trim());
                  target.value = '';
                }
              }
            }}
          />
          <Button
            size="sm"
            onClick={(e) => {
              const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
              if (input?.value.trim()) {
                onScan(input.value.trim());
                input.value = '';
              }
            }}
          >
            Test
          </Button>
        </div>
      </div>
    </div>
  );
}
