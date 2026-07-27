import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/seo/metadata";
import type { PageSeoConfig } from "@/lib/seo/metadata";
import { buildWebPageSchema } from "@/lib/seo/schema";

type SeoLayoutProps = {
  seo: PageSeoConfig;
  breadcrumb?: { name: string; path: string }[];
  extraSchemas?: Record<string, unknown>[];
  children: React.ReactNode;
};

export function createSeoMetadata(seo: PageSeoConfig): Metadata {
  return createPageMetadata(seo);
}

export function SeoLayout({ seo, breadcrumb, extraSchemas = [], children }: SeoLayoutProps) {
  const webPageSchema = buildWebPageSchema({
    path: seo.path,
    title: seo.title,
    description: seo.description,
    breadcrumb,
  });

  return (
    <>
      <JsonLd data={webPageSchema} />
      {extraSchemas.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}
      {children}
    </>
  );
}
