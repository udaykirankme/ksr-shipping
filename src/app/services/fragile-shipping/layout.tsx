import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";
import { buildIndividualServiceSchema } from "@/lib/seo/schema";

const seo = pageSeo.fragileShipping;

export const metadata: Metadata = createSeoMetadata(seo);

export default function FragileShippingLayout({ children }: { children: React.ReactNode }) {
  const serviceSchema = buildIndividualServiceSchema({
    title: "Fragile Item Shipping & Packing Services",
    description: seo.description,
    path: seo.path,
    image: "/fragile_shipping.png",
    serviceType: "Protective Packaging & Fragile Item Courier",
    areaServed: ["Hyderabad", "India", "USA", "UK", "Canada", "Australia", "UAE"],
  });

  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
        { name: "Fragile Shipping", path: "/services/fragile-shipping" },
      ]}
      extraSchemas={[serviceSchema]}
    >
      {children}
    </SeoLayout>
  );
}
