import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Contract',
  description: 'Create a new contract using AI',
};

export default function NewContractLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 