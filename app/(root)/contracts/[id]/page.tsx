// app/contract/page.js



// Have a list of contracts to choose from, depending on the field you're working with

"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from 'next/navigation';
import ContractBlock from "@/components/ContractBlock";
import SignatureModal from "@/components/SignatureModal";
import ContractSummary from "@/components/ContractSummary";



interface Contract {
  _id: string;
  content: string;
  recipientEmail?: string;
}

interface Signature {
  party: string;
  img_url: string;
  index: number; // index of the signature in the block
}

interface ContractBlock {
  text: string;
  signatures: Signature[];
}

interface ContractJson {
  blocks: ContractBlock[];
  unknowns: string[];
  assessment?: string;
}

// Skeleton loader components
const SkeletonBlock = () => (
  <div className="mb-2 p-4 rounded border border-gray-200 bg-white animate-pulse">
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="flex space-x-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-4 bg-blue-100 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
    </div>
  </div>
);

const SkeletonSummary = () => (
  <div className="bg-white rounded-lg p-6 shadow-md animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

const SkeletonSendPanel = () => (
  <div className="bg-white rounded-lg p-6 shadow-md animate-pulse">
    <div className="h-12 bg-gray-200 rounded mb-3"></div>
    <div className="h-12 bg-gray-200 rounded"></div>
  </div>
);

// Loading spinner component
const LoadingSpinner = ({ size = "w-5 h-5" }: { size?: string }) => {
  console.log('🌀 LoadingSpinner rendered with size:', size);
  return (
    <svg className={`${size} animate-spin text-white`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
};


export default function ContractPage() {
  const params = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [contractJson, setContractJson] = useState<ContractJson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignatureFor, setShowSignatureFor] = useState<{ blockIndex: number; signatureIndex: number } | null>(null);
  const [currentParty, setCurrentParty] = useState("PartyA"); // Assume user is PartyA
  const [contractRegenPrompt, setContractRegenPrompt] = useState("");
  const [isRegeneratingContract, setIsRegeneratingContract] = useState(false);
  const [isSendingContract, setIsSendingContract] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    fetchContract();
  }, []);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${params.id}`);
      if (response.ok) {
        const data = await response.json();

        setContract(data.contract);
        
        // Parse contract content since it's stored as a string
        let parsedContent;
        if (typeof data.contract.content === 'string') {
          parsedContent = JSON.parse(data.contract.content);
        } else {
          parsedContent = data.contract.content;
        }
        setContractJson(parsedContent);
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler to update a single block after regeneration
  //XXX: Regenerateblock modal should allow you to edit the TEXT ITSELF of the block OR regenerate!!!
  const handleRegenerateBlock = async (blockIndex: number, userInstructions: string) => {
    if (!contractJson) return;
    try {
      const res = await fetch("/api/regenerateBlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractJson,
          blockIndex,
          userPrompt: userInstructions,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('API Error:', errorData);
        alert(`Error regenerating block: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      const data = await res.json();
      
      // Validate the response structure
      if (!data || !data.blocks || !Array.isArray(data.blocks)) {
        console.error('Invalid response structure:', data);
        alert('Invalid response from server. Please try again.');
        return;
      }
      
      setContractJson(data);
    } catch (err) {
      console.error('Error regenerating block:', err);
      alert('Failed to regenerate block. Please try again.');
    }
  };

  // New handler for manual block edits
  const handleManualBlockEdit = (blockIndex: number, updatedBlock: any) => {
    if (!contractJson) return;
    
    setContractJson((prev) => {
      if (!prev) return prev;
      
      const updatedBlocks = [...prev.blocks];
      updatedBlocks[blockIndex] = updatedBlock;
      
      return { ...prev, blocks: updatedBlocks };
    });
  };

  // Handler to update a signature field:
  // First opens SignatureModal to capture a signature
  // Takes the resulting image and saves it as a string in the img_url field of the signature
  const handleSignatureSave = (blockIndex: number, signatureIndex: number, img_url: string) => {
    console.log('handleSignatureSave called:', { blockIndex, signatureIndex, hasImgUrl: !!img_url });
    
    setContractJson((prev) => {
      if (!prev) return prev;
      
      const updatedBlocks = [...prev.blocks];
      const block = { ...updatedBlocks[blockIndex] };
      const signatures = [...block.signatures];
      
      console.log('Before update:', {
        signatureExists: !!signatures[signatureIndex],
        currentParty,
        signatureParty: signatures[signatureIndex]?.party,
        oldImgUrl: signatures[signatureIndex]?.img_url
      });
      
      if (signatures[signatureIndex].party !== currentParty) {
        console.error(`Signature at index ${signatureIndex} is not for the current party`);
        return prev;
      }

      signatures[signatureIndex] = {
        ...signatures[signatureIndex],
        img_url: img_url
      };

      block.signatures = signatures;
      updatedBlocks[blockIndex] = block;

      console.log('After update:', {
        newImgUrl: signatures[signatureIndex].img_url,
        signatureLength: signatures[signatureIndex].img_url.length
      });

      return { ...prev, blocks: updatedBlocks };
    });
  };

  // Handler to regenerate entire contract
  const handleContractRegeneration = async () => {
    if (!contractJson || !contractRegenPrompt.trim() || isRegeneratingContract) return;
    
    console.log('🔄 Starting contract regeneration...');
    setIsRegeneratingContract(true);
    
    try {
      const res = await fetch("/api/regenerateContract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractJson,
          userPrompt: contractRegenPrompt.trim(),
        }),
      });
      const data = await res.json();
      setContractJson(data);
      setContractRegenPrompt("");
      console.log('✅ Contract regeneration completed');
    } catch (err) {
      console.error('❌ Contract regeneration failed:', err);
    } finally {
      setIsRegeneratingContract(false);
      console.log('🏁 Contract regeneration finished');
    }
  };

  
  // Handler to send contract via email
  const [recipientEmail, setRecipientEmail] = useState("");
  const handleSendContract = async () => {
    if (!contractJson || isSendingContract) return;
    
    // Ensure no blanks remain for current party
    const hasBlanks = contractJson.blocks.some((block) =>
      block.signatures.some((s) => s.party === currentParty && s.img_url === "")
    );
    if (hasBlanks) {
      alert("Please sign your designated signature fields (in blue) before sending.");
      return;
    }
    
    setIsSendingContract(true);
    try {
      const res = await fetch(`/api/contracts/${params.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractJson, recipientEmail }),
      });
      if (res.ok) {
        alert("Contract sent successfully!");
        router.push('/dashboard');
      } else {
        alert("Failed to send contract.");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending contract.");
    } finally {
      setIsSendingContract(false);
    }
  };


  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50">
      {isLoading || !contractJson ? (
        <div className="flex flex-1 px-8 py-6 space-x-6 h-0">
          {/* Left: Contract Blocks Skeleton */}
          <div className="w-7/12 flex-1 overflow-y-auto pb-4 pr-2">
            <div className="mb-6">
              <div className="h-8 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>
              <div className="text-sm text-gray-500 mb-4">Generating your contract...</div>
            </div>
            {[...Array(4)].map((_, i) => (
              <SkeletonBlock key={i} />
            ))}
          </div>

          {/* Right: Summary + Send Panel Skeleton */}
          <div className="w-5/12 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <SkeletonSummary />
            </div>
            <div className="mt-4">
              <SkeletonSendPanel />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 px-8 py-6 space-x-6 h-0">
          {/* Left: Contract Blocks + Regeneration */}
          <div className="w-7/12 flex flex-col h-full">
            {/* Contract Blocks - Scrollable */}
            <div className="flex-1 overflow-y-auto pb-4 pr-2">
              {contractJson?.blocks?.map((block, i) => (
                <ContractBlock
                  key={i}
                  block={block}
                  blockIndex={i}
                  currentParty={currentParty}
                  onSignatureClick={(signatureIndex: number) => {
                  console.log('Signature click received:', { blockIndex: i, signatureIndex, totalSignatures: block.signatures.length });
                  
                  const signature = block.signatures[signatureIndex];
                  if (!signature) {
                    console.error('No signature found at index:', signatureIndex, 'Available signatures:', block.signatures.length);
                    return;
                  }
                  
                  if (signature.party !== currentParty) {
                    console.log('Wrong party - signature belongs to:', signature.party, 'but current party is:', currentParty);
                    return;
                  }
                  
                  setShowSignatureFor({ blockIndex: i, signatureIndex });
                }}
                  
                  onRegenerate={(userInstructions: string) =>
                    handleRegenerateBlock(i, userInstructions)
                  }
                  onManualEdit={(updatedBlock: any) =>
                    handleManualBlockEdit(i, updatedBlock)
                  }
                />
              ))}
            </div>

            {/* Signature Modal */}
            {showSignatureFor && (
              <SignatureModal
                onClose={() => setShowSignatureFor(null)}
                onSave={(img_url: string) => {
                  const { blockIndex, signatureIndex } = showSignatureFor;
                  console.log('Received signature data:', {
                    blockIndex,
                    signatureIndex,
                    dataUrlLength: img_url.length,
                    dataUrlPreview: img_url.substring(0, 50) + '...'
                  });
                  handleSignatureSave(blockIndex, signatureIndex, img_url);
                  setShowSignatureFor(null);
                }}
              />
            )}
          </div>

          {/* Right: PREVIOUSLY A SUMMARY and now a list of unknowns + Send Panel */}
          <div className="w-5/12 h-full flex flex-col">
            <div className="flex-1 bg-white rounded-lg p-6 shadow-md flex flex-col">
              {/* Suggested Information - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4">Missing Information</h2>
                <ul className="list-disc pl-4 space-y-2 mb-4">
                  {contractJson?.unknowns?.map((unknown, i) => (
                    <li key={i} className="text-gray-700">{unknown}</li>
                  )) || <li className="text-gray-500">No missing information</li>}
                </ul>
                
                {/* AI Assessment */}
                {contractJson?.assessment && (
                  <div className="p-4 bg-gray-50">
                    <p className="text-sm text-gray-700">{contractJson.assessment}</p>
                  </div>
                )}
              </div>

              {/* Regenerate Contract - Fixed at Bottom */}
              <div className="flex-shrink-0 pt-4 mt-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={contractRegenPrompt}
                    onChange={(e) => setContractRegenPrompt(e.target.value)}
                    placeholder="Regenerate entire contract..."
                    className="flex-1 p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleContractRegeneration();
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      console.log('🖱️ Regenerate button clicked, current state:', isRegeneratingContract);
                      handleContractRegeneration();
                    }}
                    disabled={isRegeneratingContract}
                    className={`p-4 rounded-md transition ${
                      isRegeneratingContract 
                        ? 'bg-gray-900 cursor-not-allowed' 
                        : 'bg-black hover:bg-gray-900'
                    }`}
                  >
                    {(() => {
                      console.log('🔄 Regenerate button render - isRegeneratingContract:', isRegeneratingContract);
                      return isRegeneratingContract ? (
                        <LoadingSpinner />
                      ) : (
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                      );
                    })()}
                  </button>
                </div>
              </div>
            </div>

            {/* Recipient Email Input - Fixed at Bottom */}
            <div className="mt-4 bg-white rounded-lg p-6 shadow-md">
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Recipient Email"
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendContract();
                  }
                }}
              />
              <button
                onClick={handleSendContract}
                disabled={isSendingContract}
                className={`mt-3 w-full py-3 text-white rounded-md transition flex items-center justify-center ${
                  isSendingContract 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-black hover:bg-gray-900'
                }`}
              >
                {(() => {
                  console.log('📧 Send button render - isSendingContract:', isSendingContract);
                  return isSendingContract ? (
                    <>
                      <LoadingSpinner size="w-4 h-4" />
                      <span className="ml-2">Sending...</span>
                    </>
                  ) : (
                    'Send Contract →'
                  );
                })()}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
