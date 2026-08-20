import "./globals.css";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TransactionStatus } from "@/components/transaction/TransactionStatus";
import { TransactionProvider } from "@/providers/TransactionProvider";
import { WalletProvider } from "@/providers/WalletProvider";

export const metadata = {
  title: { default: "Aegis Bank", template: "%s | Aegis Bank" },
  description:
    "A modern, non-custodial decentralized banking interface for collateralized borrowing and transparent position health.",
};

export default function RootLayout({ children }) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        <a
          className="sr-only z-50 rounded-md bg-electric-300 px-4 py-3 font-semibold text-ink-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          href="#main-content"
        >
          Skip to content
        </a>
        <WalletProvider>
          <TransactionProvider>
            <SiteHeader />
            {children}
            <SiteFooter />
            <TransactionStatus />
          </TransactionProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
