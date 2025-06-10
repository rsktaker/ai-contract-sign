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
        // Try getTrimmedCanvas first (if available)
        if (typeof sigCanvasRef.current.getTrimmedCanvas === 'function') {
          const dataUrl = sigCanvasRef.current.getTrimmedCanvas().toDataURL();
          console.log('Signature saved with getTrimmedCanvas:', dataUrl.substring(0, 50) + '...');
          onSave(dataUrl);
        } else {
          // Fallback to regular canvas
          const dataUrl = sigCanvasRef.current.getCanvas().toDataURL();
          console.log('Signature saved with getCanvas:', dataUrl.substring(0, 50) + '...');
          onSave(dataUrl);
        }
      } catch (error) {
        console.error('Error saving signature:', error);
        // Final fallback - use toDataURL directly
        const dataUrl = sigCanvasRef.current.toDataURL();
        console.log('Signature saved with fallback toDataURL:', dataUrl.substring(0, 50) + '...');
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
