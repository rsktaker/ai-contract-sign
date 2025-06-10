// components/ContractBlock.js
"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogBackdrop, DialogTitle } from "@headlessui/react";
import { server_log } from '@/app/actions/log';

export default function ContractBlock({
  block,
  blockIndex,
  currentParty,
  onSignatureClick,
  onRegenerate,
}) {
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState("");
  const [editingPlaceholder, setEditingPlaceholder] = useState(null); // Index of placeholder being edited
  const [editingText, setEditingText] = useState("");


  const renderBlockText = () => {
    const text = block.text;
    const underscorePattern = /_{20}/g; // Matches 10 or 20 underscores
    const parts = [];
    let lastIndex = 0;
    let match;
    let signatureIndex = 0;
    let signatures = block.signatures[signatureIndex];

    server_log(`Block ${blockIndex} text analysis:`, {
      textLength: text.length,
      signatureCount: block.signatures.length,
      signatures: block.signatures
    });

    let whichSignature = 0;
    while ((match = underscorePattern.exec(text)) !== null) {

      let signature = signatures[whichSignature];
      const isCurrentParty = signature.party === currentParty;
      const bgClass = isCurrentParty ? "bg-blue-100 hover:bg-blue-200" : "bg-red-100 hover:bg-red-200";


      // Add text before the underscores (preserve newlines)
      if (match.index > lastIndex) {
        signatureIndex = match.index;
        signature.index = signatureIndex;
        const textBefore = text.slice(lastIndex, match.index);
        parts.push(
          <span key={`text_${blockIndex}_${signatureIndex}`} className="whitespace-pre-wrap">
            {textBefore}
          </span>
        );
      }
      
      
      parts.push(
        <span
          key={`ph_${blockIndex}_${signatureIndex}`}
          className={`relative inline-block ${bgClass} rounded px-1 py-0.5 font-mono transition-colors duration-150 ${
            isCurrentParty ? 'cursor-pointer' : 'cursor-not-allowed'
            // XXX: That cursor-not-allowed thing is too ugly, make it a better thing in general some modal or something when you click on it.
          }`}
          data-index={signatureIndex}
          data-party={signature?.party || "PartyA"}
          onClick={(e) => {
            e.stopPropagation(); // Prevent parent block click
            
            // Always use the array index of the found placeholder for consistency            
            server_log("Signature Field Clicked:", {
              signature,
              signatureIndex,
              isCurrentParty,
              currentParty,
            });
            
            server_log("Opening signature/date modal for index:", signatureIndex);
            onSignatureClick(signatureIndex);
          }}
        >
          {signature?.img_url ? (
            <img 
              src={signature.img_url} 
              alt="Signature" 
              className="inline-block h-6 max-w-24 object-contain"
            />
          ) : (
            match[0] /* Render the actual underscores (10 or 20) */
          )}
        </span>
      );
    }
    

    lastIndex = match.index + match[0].length;
    whichSignature++;
    

    // Add remaining text (preserve newlines)
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      parts.push(
        <span key={`rest_${blockIndex}`} className="whitespace-pre-wrap">
          {remainingText}
        </span>
      );
    }

    return parts;
  };

  const handleRegenerateSubmit = () => {
    if (regenPrompt.trim()) {
      onRegenerate(regenPrompt.trim());
      setShowRegenerateModal(false);
      setRegenPrompt("");
    }
  };

  return (
    <div className="mb-1">
      <div
        className="p-4 mb-2 rounded border border-transparent hover:border-gray-300 cursor-pointer transition relative"
        onClick={(e) => {
          // Check if the click target is a signature span or its child
          const clickedElement = e.target;
          const isSignatureClick = clickedElement.closest('[data-type]') !== null;
          
          // Only open regenerate modal if it wasn't a signature click
          if (!isSignatureClick) {
            setShowRegenerateModal(true);
          }
        }}
      >
        {renderBlockText()}
      </div>

      {/* Regenerate Block Modal */}

      {/* XXX: I want two different modes of editing a block. The first being to display all the raw text as it is in an input field to edit, and the second to regenerate it. 


So, I want the modal to come up. I want to keep the x button for the close. 

I want to split it into two halves (and make it wider). The first half should be the entire block text in an input field. Above that should say "Manual Editing" and then the second half should have an input field (but that's for the prompt) and then a "Regenerate" button under that too. I want to show the block text as an input field or like a text field. 

Also, after regeneration, I need signatureIndex (s) to be updated by running the regex matching thing again on the new block. 
Same with the unknown list, I need that to be updated as well.*/}
      <Dialog
        open={showRegenerateModal}
        onClose={() => setShowRegenerateModal(false)}
        className="fixed z-10 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <DialogBackdrop className="fixed inset-0 bg-black opacity-30" />
          <DialogPanel className="relative bg-white rounded-lg max-w-lg w-full p-6">
            <DialogTitle className="text-lg font-semibold mb-2">
              Regenerate Block #{blockIndex + 1}
            </DialogTitle>
            <textarea
              rows={4}
              value={regenPrompt}
              onChange={(e) => setRegenPrompt(e.target.value)}
              placeholder="Tell me how to update this block..."
              className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-4"
            />
            <button
              onClick={handleRegenerateSubmit}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition"
            >
              Regenerate
            </button>
            <button
              onClick={() => setShowRegenerateModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              &#x2715;
            </button>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
