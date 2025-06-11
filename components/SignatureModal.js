// components/SignatureModal.js
"use client";

import { useRef, useEffect } from "react";
import { Dialog, DialogPanel, DialogBackdrop, DialogTitle } from "@headlessui/react";
import SignatureCanvas from "react-signature-canvas";

export default function SignatureModal({ onClose, onSave }) {
  const sigCanvasRef = useRef(null);

  // Set willReadFrequently on the canvas element to avoid performance warnings
  useEffect(() => {
    if (sigCanvasRef.current) {
      const canvas = sigCanvasRef.current.getCanvas();
      if (canvas) {
        const context = canvas.getContext('2d', { willReadFrequently: true });
      }
    }
  }, []);

  const handleSave = () => {
    if (sigCanvasRef.current) {
      // Check if signature is empty first
      if (sigCanvasRef.current.isEmpty()) {
        alert('Please provide a signature before saving.');
        return;
      }
      
      try {
        // Get the signature canvas
        let canvas;
        if (typeof sigCanvasRef.current.getTrimmedCanvas === 'function') {
          canvas = sigCanvasRef.current.getTrimmedCanvas();
        } else {
          canvas = sigCanvasRef.current.getCanvas();
        }

        // Create a new canvas to add the date
        const newCanvas = document.createElement('canvas');
        const ctx = newCanvas.getContext('2d');
        
        // Get current date
        const currentDate = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'numeric', 
          day: 'numeric' 
        });
        
        // Set canvas size to accommodate both signature and date
        const padding = 15;
        const dateWidth = 120; // Increased for better spacing
        newCanvas.width = canvas.width + dateWidth + padding;
        newCanvas.height = Math.max(canvas.height, 50); // Ensure enough height for date
        
        // Keep background transparent - don't fill with white
        
        // Draw the signature
        ctx.drawImage(canvas, 0, 0);
        
        // Add the date to the right of the signature
        ctx.fillStyle = 'black';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const dateX = canvas.width + padding;
        const dateY = newCanvas.height / 2;
        ctx.fillText(currentDate, dateX, dateY);
        
        // Convert to data URL with PNG format to preserve transparency
        const dataUrl = newCanvas.toDataURL('image/png');
        onSave(dataUrl);
        
      } catch (error) {
        console.error('Error saving signature with date:', error);
        // Fallback - save without date
        const dataUrl = sigCanvasRef.current.toDataURL('image/png');
        onSave(dataUrl);
      }
    }
  };

  const handleClear = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      className="fixed z-20 inset-0 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <DialogBackdrop className="fixed inset-0 bg-black opacity-30" />
        <DialogPanel className="relative bg-white rounded-lg max-w-md w-full p-6">
          <DialogTitle className="text-lg font-semibold mb-2">
            Sign Here
          </DialogTitle>
          <div className="border border-gray-300 rounded mb-4">
            <SignatureCanvas
              penColor="black"
              canvasProps={{
                width: 400,
                height: 200,
                className: "rounded"
              }}
              ref={sigCanvasRef}
            />
          </div>
          <div className="flex justify-between">
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition"
            >
              Clear
            </button>
            <div className="space-x-2">
              {/* XXX: Instead of a cancel button I want an x on the top right of the modal. */}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition"
              >
                Save
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
