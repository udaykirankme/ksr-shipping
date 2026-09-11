import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";
import { buildIndividualServiceSchema } from "@/lib/seo/schema";

const seo = pageSeo.medicineShipping;

export const metadata: Metadata = createSeoMetadata(seo);

export default function MedicineShippingLayout({ children }: { children: React.ReactNode }) {
  const serviceSchema = buildIndividualServiceSchema({
    title: "Medicine Courier Services",
    description: seo.description,
    path: seo.path,
    image: "/medicine_shipping.png",
    serviceType: "Prescription Medicine Logistics & Healthcare Shipping",
    areaServed: ["Hyderabad", "USA", "UK", "Canada", "Australia", "UAE", "Singapore", "India"],
  });

  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
        { name: "Medicine Shipping", path: "/services/medicine-shipping" },
      ]}
      extraSchemas={[serviceSchema]}
    >
      {children}
    </SeoLayout>
  );
}
