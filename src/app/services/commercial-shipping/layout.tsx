import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";
import { buildIndividualServiceSchema } from "@/lib/seo/schema";

const seo = pageSeo.commercialShipping;

export const metadata: Metadata = createSeoMetadata(seo);

export default function CommercialShippingLayout({ children }: { children: React.ReactNode }) {
  const serviceSchema = buildIndividualServiceSchema({
    title: "Commercial & B2B Cargo Logistics Services",
    description: seo.description,
    path: seo.path,
    image: "/commercial_shipping.png",
    serviceType: "Commercial Cargo & Enterprise B2B Logistics",
    areaServed: ["Hyderabad", "Telangana", "India", "USA", "UK", "UAE", "Europe"],
  });

  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
        { name: "Commercial Shipping", path: "/services/commercial-shipping" },
      ]}
      extraSchemas={[serviceSchema]}
    >
      {children}
    </SeoLayout>
  );
}
