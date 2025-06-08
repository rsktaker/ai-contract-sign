'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SignaturePad from '@/components/SignaturePad';

interface Contract {
  _id: string;
  title: string;
  content: string;
  parties: Array<{
    name: string;
    email: string;
    role: string;
    signed: boolean;
  }>;
  status: string;
}

export default function SignContractPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const partyEmail = searchParams.get('party');
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [currentParty, setCurrentParty] = useState<Contract['parties'][0] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContract();
  }, []);

  useEffect(() => {
    if (contract && partyEmail) {
      const party = contract.parties.find(p => p.email === partyEmail);
      setCurrentParty(party || null);
    }
  }, [contract, partyEmail]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setContract(data.contract);
      } else {
        setError('Failed to load contract');
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
      setError('Error loading contract');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!signature || !currentParty || !agreed) return;

    setSigning(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/contracts/${params.id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partyEmail: currentParty.email,
          signature: signature,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        // Redirect back to contract view
        router.push(`/contracts/${params.id}`);
      } else {
        // Get the actual error message from the response
        const errorData = await response.json();
        console.error('Sign error:', errorData);
        setError(errorData.error || 'Failed to sign contract');
      }
    } catch (error) {
      console.error('Error signing contract:', error);
      setError('An error occurred while signing. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!contract) return <div className="p-8">Contract not found</div>;
  if (!currentParty) return <div className="p-8">Invalid signing link</div>;
  if (currentParty.signed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <svg className="w-16 h-16 text-green-600 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Already Signed
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You have already signed this contract.
          </p>
          <Link
            href={`/contracts/${params.id}`}
            className="text-blue-600 hover:text-blue-800"
          >
            View Contract
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Sign Contract: {contract.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Signing as: <strong>{currentParty.name}</strong> ({currentParty.role})
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contract Content */}
        <div 
          className="shadow-md rounded-lg p-8 mb-6"
          style={{ 
            backgroundColor: 'var(--background)',
            border: '1px solid rgba(128, 128, 128, 0.2)',
            color: 'var(--foreground)'
          }}
        >
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Contract Terms
          </h2>
          <div 
            className="prose max-w-none mb-6" 
            style={{ 
              color: 'var(--foreground)',
              maxHeight: '400px',
              overflowY: 'auto'
            }}
          >
            <div 
              dangerouslySetInnerHTML={{ __html: contract.content.replace(/\n/g, '<br />') }}
            />
          </div>

          {/* Agreement Checkbox */}
          <div className="border-t pt-4">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 mr-3"
              />
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                I have read and agree to the terms and conditions outlined in this contract. 
                I understand that my electronic signature is legally binding.
              </span>
            </label>
          </div>
        </div>

        {/* Signature Section */}
        <div 
          className="shadow-md rounded-lg p-8"
          style={{ 
            backgroundColor: 'var(--background)',
            border: '1px solid rgba(128, 128, 128, 0.2)',
            color: 'var(--foreground)'
          }}
        >
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Your Signature
          </h2>
          
          {!signature ? (
            <SignaturePad onSave={setSignature} />
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                <img src={signature} alt="Your signature" className="max-h-32" />
              </div>
              <button
                onClick={() => setSignature(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                style={{ color: 'var(--foreground)' }}
              >
                Redo Signature
              </button>
            </div>
          )}

          {/* Sign Button */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleSign}
              disabled={!signature || !agreed || signing}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                signature && agreed && !signing
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {signing ? 'Signing...' : 'Sign Contract'}
            </button>
            <Link
              href={`/contracts/${params.id}`}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              style={{ color: 'var(--foreground)' }}
            >
              Cancel
            </Link>
          </div>

          {(!signature || !agreed) && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {!agreed && "Please agree to the terms before signing. "}
              {!signature && "Please provide your signature above."}
            </p>
          )}
        </div>

        {/* Legal Notice */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                By signing this document electronically, you agree that your electronic signature 
                is the legal equivalent of your manual signature on this contract.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}