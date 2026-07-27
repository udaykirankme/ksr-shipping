import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { SERVICE_SCHEMA_ITEMS } from "@/lib/data/services-schema";
import { pageSeo } from "@/lib/seo/pages";
import { buildServiceCatalogSchema } from "@/lib/seo/schema";

const seo = pageSeo.services;

export const metadata: Metadata = createSeoMetadata(seo);

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
      ]}
      extraSchemas={[buildServiceCatalogSchema(SERVICE_SCHEMA_ITEMS)]}
    >
      {children}
    </SeoLayout>
  );
}
