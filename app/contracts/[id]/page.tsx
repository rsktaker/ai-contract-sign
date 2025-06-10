// app/contract/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from 'next/navigation';
import ContractBlock from "@/components/ContractBlock";
import SignatureModal from "@/components/SignatureModal";
import ContractSummary from "@/components/ContractSummary";



interface Contract {
  _id: string;
  content: ContractJson;
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


export default function ContractPage() {
  const params = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [contractJson, setContractJson] = useState<ContractJson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignatureFor, setShowSignatureFor] = useState<{ blockIndex: number; signatureIndex: number } | null>(null);
  const [currentParty, setCurrentParty] = useState("PartyA"); // Assume user is PartyA
  const [contractRegenPrompt, setContractRegenPrompt] = useState("");
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
        setContractJson(data.contract.content);
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
      const data = await res.json();
      setContractJson(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Handler to update a signature field:
  // First opens SignatureModal to capture a signature
  // Takes the resulting image and saves it as a string in the img_url field of the signature
  const handleSignatureSave = (blockIndex: number, signatureIndex: number, img_url: string) => {
    setContractJson((prev) => {
      if (!prev) return prev;
      
      const updatedBlocks = [...prev.blocks];
      const block = { ...updatedBlocks[blockIndex] };
      const signatures = [...block.signatures];
      
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

      return { ...prev, blocks: updatedBlocks };
    });
  };

  // Handler to regenerate entire contract
  const handleContractRegeneration = async () => {
    if (!contractJson || !contractRegenPrompt.trim()) return;
    
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
    } catch (err) {
      console.error(err);
    }
  };

  
  // Handler to send contract via email
  const [recipientEmail, setRecipientEmail] = useState("");
  const handleSendContract = async () => {
    if (!contractJson) return;
    // Ensure no blanks remain for current party
    const hasBlanks = contractJson.blocks.some((block) =>
      block.signatures.some((s) => s.party === currentParty && s.img_url === "")
    );
    if (hasBlanks) {
      alert("Please sign your designated signature fields (in blue) before sending.");
      return;
    }
    try {
      const res = await fetch("/api/contracts/[id]/send", {
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
    }
  };


  return (
    <div className="flex flex-col h-screen bg-gray-50">
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
          {/* Left: Contract Blocks */}
          <div className="w-7/12 flex-1 overflow-y-auto pb-4 pr-2">
            {contractJson.blocks.map((block, i) => (
              <ContractBlock
                key={i}
                block={block}
                blockIndex={i}
                currentParty={currentParty}
                onSignatureClick={(signatureIndex: number) => {
                  const signature = block.signatures[signatureIndex];
                  if (signature.party !== currentParty) return;
                    setShowSignatureFor({ blockIndex: i, signatureIndex });
                }}
                
                onRegenerate={(userInstructions: string) =>
                  handleRegenerateBlock(i, userInstructions)
                }
              />
            ))}

            {/* Contract Regeneration Input */}
            <div className="m-6 bg-white rounded-lg p-4 shadow-md">
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
                  onClick={handleContractRegeneration}
                  className="p-4 bg-black rounded-md hover:bg-gray-900 transition"
                >
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Signature Modal */}
            {showSignatureFor && (
              <SignatureModal
                onClose={() => setShowSignatureFor(null)}
                onSave={(img_url: string) => {
                  const { blockIndex, signatureIndex } = showSignatureFor;
                  handleSignatureSave(blockIndex, signatureIndex, img_url);
                  setShowSignatureFor(null);
                }}
              />
            )}
          </div>

          {/* Right: PREVIOUSLY A SUMMARY and now a list of unknowns + Send Panel */}
          <div className="w-5/12 h-full flex flex-col">
            <div className="flex-1 bg-white rounded-lg p-6 shadow-md overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">Missing Information</h2>
              <ul className="list-disc pl-4 space-y-2">
                {contractJson.unknowns.map((unknown, i) => (
                  <li key={i} className="text-gray-700">{unknown}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4 bg-white rounded-lg p-6 shadow-md">
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Recipient Email"
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                onClick={handleSendContract}
                className="mt-3 w-full py-3 bg-black text-white rounded-md hover:bg-gray-900 transition"
              >
                Send Contract &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
