import type { Metadata } from 'next';
import { Public_Sans } from 'next/font/google';
import './globals.css';
import { HydrationGate } from '@/components/shell/HydrationGate';
import { ToastViewport } from '@/components/ui/ToastViewport';

const publicSans = Public_Sans({
  variable: '--font-public-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Atlas Marketplace',
  description: 'Sealed lots, sealed bids, escrow until counted.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${publicSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper text-ink">
        <HydrationGate>{children}</HydrationGate>
        <ToastViewport />
      </body>
    </html>
  );
}
