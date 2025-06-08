'use client';

import { useRef, useEffect, useState } from 'react';

interface SignaturePadProps {
  onSave: (signature: string) => void;
}

export default function SignaturePad({ onSave }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signature = canvas.toDataURL('image/png');
    onSave(signature);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-gray-300 rounded-lg p-4">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="border border-gray-200 cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
      <div className="flex gap-4">
        <button
          onClick={clearSignature}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Clear
        </button>
        <button
          onClick={saveSignature}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Signature
        </button>
      </div>
    </div>
  );
}