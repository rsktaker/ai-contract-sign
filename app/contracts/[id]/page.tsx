'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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

export default function ContractPage() {
  const params = useParams();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    fetchContract();
  }, []);

  useEffect(() => {
    if (contract) {
      setEditedTitle(contract.title);
      setEditedContent(contract.content);
    }
  }, [contract]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setContract(data.contract);
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!contract) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/contracts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
        }),
      });

      if (response.ok) {
        // Update the local state
        setContract({
          ...contract,
          title: editedTitle,
          content: editedContent,
        });
        setEditing(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to save changes: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving contract:', error);
      alert('An error occurred while saving. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (contract) {
      setEditedTitle(contract.title);
      setEditedContent(contract.content);
    }
    setEditing(false);
  };

  const canEdit = contract && contract.status !== 'completed';
  const hasSignatures = contract?.parties.some(party => party.signed);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!contract) return <div className="p-8">Contract not found</div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto p-8">
        {/* Back link */}
        <Link 
          href="/dashboard" 
          className="text-blue-600 hover:text-blue-800 mb-6 inline-block"
        >
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          {editing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-3xl font-bold bg-transparent border-b-2 border-blue-500 outline-none flex-1 mr-4"
              style={{ color: 'var(--foreground)' }}
              placeholder="Contract Title"
            />
          ) : (
            <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
              {contract.title}
            </h1>
          )}
          
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm ${
              contract.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}>
              {contract.status}
            </span>
            
            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                disabled={hasSignatures}
                title={hasSignatures ? "Cannot edit contract with existing signatures" : "Edit contract"}
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Warning for contracts with signatures */}
        {hasSignatures && canEdit && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This contract has existing signatures and cannot be edited. Create a new version if changes are needed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Edit Controls */}
        {editing && (
          <div className="mb-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                saving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Cancel
            </button>
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
          {editing ? (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Contract Content:
              </label>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-96 p-4 border rounded-md resize-none"
                style={{ 
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  border: '1px solid rgba(128, 128, 128, 0.3)'
                }}
                placeholder="Enter contract content..."
              />
              <p className="text-sm text-gray-500 mt-2">
                Use line breaks for paragraphs. HTML tags are not supported in edit mode.
              </p>
            </div>
          ) : (
            <div className="prose max-w-none" style={{ color: 'inherit' }}>
              <div 
                dangerouslySetInnerHTML={{ __html: contract.content.replace(/\n/g, '<br />') }}
                style={{ color: 'var(--foreground)' }}
              />
            </div>
          )}
        </div>

        {/* Signature Status */}
        <div 
          className="rounded-lg p-6"
          style={{ 
            backgroundColor: 'rgba(128, 128, 128, 0.1)',
            border: '1px solid rgba(128, 128, 128, 0.1)'
          }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Signature Status
          </h2>
          <div className="space-y-3">
            {contract.parties.map((party, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                    {party.name}
                  </p>
                  <p 
                    className="text-sm"
                    style={{ 
                      color: 'var(--foreground)',
                      opacity: 0.7 
                    }}
                  >
                    {party.role} - {party.email}
                  </p>
                </div>
                {party.signed ? (
                  <span className="text-green-600 dark:text-green-400 flex items-center">
                    <svg className="w-5 h-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Signed
                  </span>
                ) : (
                  <Link
                    href={`/contracts/sign/${contract._id}?party=${party.email}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Sign Document
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {editing 
                  ? "You are currently editing this contract. Save your changes or cancel to exit edit mode."
                  : "All parties must sign this contract for it to be marked as completed. Each party will receive a copy once all signatures are collected."
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}