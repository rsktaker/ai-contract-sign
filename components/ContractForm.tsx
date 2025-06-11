'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Party {
  name: string;
  email: string;
  role: string;
}

export default function ContractForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'service',
    parties: [
      { name: '', email: '', role: 'Client' },
      { name: '', email: '', role: 'Service Provider' }
    ],
    terms: '',
    additionalRequirements: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const { contract } = await response.json();
        router.push(`/contracts/${contract._id}`);
      } else {
        alert('Failed to generate contract');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateParty = (index: number, field: keyof Party, value: string) => {
    const newParties = [...formData.parties];
    newParties[index] = { ...newParties[index], [field]: value };
    setFormData({ ...formData, parties: newParties });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Contract Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full p-2 border rounded-md"
        >
          <option value="service">Service Agreement</option>
          <option value="nda">Non-Disclosure Agreement</option>
          <option value="employment">Employment Contract</option>
          <option value="lease">Lease Agreement</option>
          <option value="custom">Custom Contract</option>
        </select>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Parties Involved</h3>
        {formData.parties.map((party, index) => (
          <div key={index} className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={party.name}
              onChange={(e) => updateParty(index, 'name', e.target.value)}
              className="p-2 border rounded-md"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={party.email}
              onChange={(e) => updateParty(index, 'email', e.target.value)}
              className="p-2 border rounded-md"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              required
            />
            <input
              type="text"
              placeholder="Role"
              value={party.role}
              onChange={(e) => updateParty(index, 'role', e.target.value)}
              className="p-2 border rounded-md"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              required
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Key Terms and Conditions</label>
        <textarea
          value={formData.terms}
          onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
          className="w-full p-2 border rounded-md h-32"
          placeholder="Describe the main terms, payment details, deliverables, timeline, etc."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Additional Requirements</label>
        <textarea
          value={formData.additionalRequirements}
          onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
          className="w-full p-2 border rounded-md h-24"
          placeholder="Any specific clauses or requirements you need"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Generating Contract...' : 'Generate Contract'}
      </button>
    </form>
  );
}