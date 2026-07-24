import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Dashboard | KSR Shipping Services",
  description: "Internal dashboard for KSR Shipping Services",
  icons: {
    icon: '/favicon.ico',
  },
};

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} antialiased selection:bg-orange-200 selection:text-orange-900`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
