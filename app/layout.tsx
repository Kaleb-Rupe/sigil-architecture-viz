import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sigil Architecture',
  description: 'Interactive architecture visualizer for the Sigil protocol — on-chain program, SDKs, and data flow.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        style={{
          margin: 0,
          padding: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          background: '#0F0F0F',
          color: '#E2E8F0',
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
