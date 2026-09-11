import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";
import { buildIndividualServiceSchema } from "@/lib/seo/schema";

const seo = pageSeo.documentShipping;

export const metadata: Metadata = createSeoMetadata(seo);

export default function DocumentShippingLayout({ children }: { children: React.ReactNode }) {
  const serviceSchema = buildIndividualServiceSchema({
    title: "Express Document Delivery Services",
    description: seo.description,
    path: seo.path,
    image: "/express_document_delivery.png",
    serviceType: "Urgent Document & Confidential Paperwork Courier",
    areaServed: ["Hyderabad", "India", "USA", "UK", "Canada", "Australia", "UAE", "Singapore", "Europe"],
  });

  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
        { name: "Document Shipping", path: "/services/document-shipping" },
      ]}
      extraSchemas={[serviceSchema]}
    >
      {children}
    </SeoLayout>
  );
}
