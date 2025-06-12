import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Contract Sign',
  description: 'AI-powered contract generation and signing platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
    </div>
  );
}
