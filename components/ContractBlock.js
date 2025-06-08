// components/ContractBlock.js
"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogBackdrop, DialogTitle } from "@headlessui/react";

export default function ContractBlock({
  block,
  blockIndex,
  currentParty,
  onPlaceholderClick,
  onTextInputFinish,
  onRegenerate,
}) {
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState("");
  const [editingPlaceholder, setEditingPlaceholder] = useState(null); // Index of placeholder being edited
  const [editingText, setEditingText] = useState("");

  // Debug: Log all placeholders for this block
  console.log(`Block ${blockIndex} debug:`, {
    currentParty,
    placeholders: block.placeholders.map((p, i) => ({
      index: i,
      type: p.type,
      party: p.party,
      label: p.label,
      offset: p.offset,
      length: p.length,
      isCurrentParty: p.party.replace(/\s+/g, "") === currentParty
    }))
  });

  const sortedPlaceholders = [...block.placeholders].sort(
    (a, b) => a.offset - b.offset
  );

  const renderBlockText = () => {
    // Handle both 10 underscores (regular fields) and 20 underscores (signatures)
    const text = block.text;
    const underscorePattern = /_{10,20}/g; // Matches 10 or 20 underscores
    const parts = [];
    let lastIndex = 0;
    let match;
    let placeholderIndex = 0;

    console.log(`Block ${blockIndex} text analysis:`, {
      textLength: text.length,
      placeholderCount: block.placeholders.length,
      placeholders: block.placeholders.map((p, i) => ({
        index: i,
        offset: p.offset,
        length: p.length,
        type: p.type,
        party: p.party,
        label: p.label,
        textAtOffset: text.slice(p.offset, p.offset + p.length)
      }))
    });

    while ((match = underscorePattern.exec(text)) !== null) {
      // Add text before the underscores (preserve newlines)
      if (match.index > lastIndex) {
        const textBefore = text.slice(lastIndex, match.index);
        parts.push(
          <span key={`text_${blockIndex}_${placeholderIndex}`} className="whitespace-pre-wrap">
            {textBefore}
          </span>
        );
      }

      // Try multiple strategies to find the corresponding placeholder
      let placeholder = null;
      let actualPlaceholderIndex = -1;
      
      // Strategy 1: Exact offset match
      placeholder = block.placeholders.find(p => p.offset === match.index);
      if (placeholder) {
        actualPlaceholderIndex = block.placeholders.indexOf(placeholder);
        console.log(`✅ Found placeholder by exact offset match:`, { 
          matchIndex: match.index, 
          placeholderOffset: placeholder.offset,
          placeholderIndex: actualPlaceholderIndex 
        });
      } else {
        // Strategy 2: Find by underscore length and proximity
        const matchLength = match[0].length;
        placeholder = block.placeholders.find(p => 
          p.length === matchLength && 
          Math.abs(p.offset - match.index) <= 5 // Allow small offset differences
        );
        if (placeholder) {
          actualPlaceholderIndex = block.placeholders.indexOf(placeholder);
          console.log(`✅ Found placeholder by length + proximity:`, { 
            matchIndex: match.index, 
            placeholderOffset: placeholder.offset,
            matchLength,
            placeholderLength: placeholder.length,
            placeholderIndex: actualPlaceholderIndex 
          });
        } else {
          // Strategy 3: Use positional matching (nth underscore = nth placeholder)
          if (placeholderIndex < block.placeholders.length) {
            placeholder = block.placeholders[placeholderIndex];
            actualPlaceholderIndex = placeholderIndex;
            console.log(`✅ Found placeholder by position:`, { 
              placeholderIndex, 
              placeholder,
              matchIndex: match.index 
            });
          } else {
            console.log(`❌ No placeholder found for underscore:`, { 
              matchIndex: match.index, 
              matchLength: match[0].length,
              placeholderIndex,
              totalPlaceholders: block.placeholders.length 
            });
          }
        }
      }

      const isCurrentParty = placeholder && placeholder.party.replace(/\s+/g, "") === currentParty;
      const bgClass = isCurrentParty ? "bg-blue-100 hover:bg-blue-200" : "bg-gray-200 hover:bg-gray-300";
      const isSignature = match[0].length === 20; // 20 underscores = signature
      
      // Check if this placeholder is being edited
      const isBeingEdited = editingPlaceholder !== null && actualPlaceholderIndex !== -1 && editingPlaceholder === actualPlaceholderIndex;
      
      if (isBeingEdited) {
        // Render input field
        parts.push(
          <input
            key={`input_${blockIndex}_${placeholderIndex}`}
            type="text"
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            onBlur={() => {
              if (editingText.trim()) {
                // Use the consistent valid index
                const validIndex = actualPlaceholderIndex !== -1 ? actualPlaceholderIndex : block.placeholders.indexOf(placeholder);
                onTextInputFinish(validIndex, editingText.trim());
              }
              setEditingPlaceholder(null);
              setEditingText("");
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (editingText.trim()) {
                  // Use the consistent valid index
                  const validIndex = actualPlaceholderIndex !== -1 ? actualPlaceholderIndex : block.placeholders.indexOf(placeholder);
                  onTextInputFinish(validIndex, editingText.trim());
                }
                setEditingPlaceholder(null);
                setEditingText("");
              } else if (e.key === 'Escape') {
                setEditingPlaceholder(null);
                setEditingText("");
              }
            }}
            autoFocus
            className="inline-block bg-blue-50 border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={placeholder?.label || "Enter text"}
            style={{ width: Math.max(100, editingText.length * 8 + 20) + 'px' }}
          />
        );
      } else {
        // Add highlighted underscores with monospace font and hover effects
        parts.push(
          <span
            key={`ph_${blockIndex}_${placeholderIndex}`}
            className={`relative inline-block ${bgClass} rounded px-1 py-0.5 font-mono transition-colors duration-150 ${
              isCurrentParty ? 'cursor-pointer' : 'cursor-default'
            }`}
            data-index={placeholderIndex}
            data-type={placeholder?.type || (isSignature ? "signature" : "unknown")}
            data-label={placeholder?.label || "Fill this field"}
            data-party={placeholder?.party || "PartyA"}
            onClick={(e) => {
              e.stopPropagation(); // Prevent parent block click
              
              // Always use the array index of the found placeholder for consistency
              let validPlaceholderIndex = actualPlaceholderIndex;
              if (placeholder && actualPlaceholderIndex === -1) {
                // If we found a placeholder but don't have a valid index, find it manually
                validPlaceholderIndex = block.placeholders.indexOf(placeholder);
              }
              
              console.log("Placeholder clicked:", {
                placeholder,
                isCurrentParty,
                actualPlaceholderIndex,
                validPlaceholderIndex,
                isSignature,
                type: placeholder?.type,
                placeholderParty: placeholder?.party,
                currentParty,
                partyMatch: placeholder?.party.replace(/\s+/g, "") === currentParty
              });
              
              if (placeholder && isCurrentParty && validPlaceholderIndex !== -1) {
                // For signatures and dates, use the parent callback
                if (placeholder.type === "signature" || placeholder.type === "date" || isSignature) {
                  console.log("Opening signature/date modal for index:", validPlaceholderIndex);
                  onPlaceholderClick(validPlaceholderIndex);
                } else {
                  // For text fields, start inline editing
                  console.log("Starting inline editing for index:", validPlaceholderIndex);
                  setEditingPlaceholder(validPlaceholderIndex);
                  setEditingText("");
                }
              } else {
                console.log("Click ignored - conditions not met:", {
                  hasPlaceholder: !!placeholder,
                  isCurrentParty,
                  validIndex: validPlaceholderIndex !== -1,
                  placeholderParty: placeholder?.party,
                  currentParty
                });
              }
            }}
          >
            {match[0]} {/* Render the actual underscores (10 or 20) */}
          </span>
        );
      }

      lastIndex = match.index + match[0].length;
      placeholderIndex++;
    }

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
          // Check if the click target is a placeholder span or its child
          const clickedElement = e.target;
          const isPlaceholderClick = clickedElement.closest('[data-type]') !== null;
          
          // Only open regenerate modal if it wasn't a placeholder click
          if (!isPlaceholderClick) {
            setShowRegenerateModal(true);
          }
        }}
      >
        {renderBlockText()}
      </div>

      {/* Regenerate Block Modal */}
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
