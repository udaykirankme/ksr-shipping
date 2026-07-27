import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PublicLayoutWrapper } from "@/components/layout/PublicLayoutWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { rootMetadata } from "@/lib/seo/metadata";
import { buildGlobalSchemaGraph, buildWebPageSchema } from "@/lib/seo/schema";
import { pageSeo } from "@/lib/seo/pages";
import { THEME_COLOR } from "@/lib/seo/site";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = rootMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: THEME_COLOR,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const homeSeo = pageSeo.home;

  return (
    <html lang="en-IN" suppressHydrationWarning className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://www.google.com" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
        <JsonLd data={buildGlobalSchemaGraph()} />
        <JsonLd
          data={buildWebPageSchema({
            path: homeSeo.path,
            title: homeSeo.title,
            description: homeSeo.description,
          })}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.className} ${inter.variable} bg-white text-gray-900 antialiased min-h-screen flex flex-col`}
      >
        <PublicLayoutWrapper>{children}</PublicLayoutWrapper>
      </body>
    </html>
  );
}
