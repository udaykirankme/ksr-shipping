import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { business } from "@ksr/config";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: business.seo.defaultTitle,
  description: business.seo.defaultDescription,
  keywords: business.seo.keywords,
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    image: business.logoUrl,
    '@id': '',
    url: 'https://ksr-shipping.com', // Placeholder URL
    telephone: business.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address,
      addressLocality: 'Hyderabad',
      addressRegion: 'Telangana',
      addressCountry: 'IN'
    }
  };

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className={`${inter.className} bg-white text-gray-900 antialiased min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">
           {children}
        </main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
