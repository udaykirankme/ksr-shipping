import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";
import { buildIndividualServiceSchema } from "@/lib/seo/schema";

const seo = pageSeo.domesticCourier;

export const metadata: Metadata = createSeoMetadata(seo);

export default function DomesticCourierLayout({ children }: { children: React.ReactNode }) {
  const serviceSchema = buildIndividualServiceSchema({
    title: "Domestic Courier Services",
    description: seo.description,
    path: seo.path,
    image: "/domestic_courier.png",
    serviceType: "Domestic Courier Delivery Across India",
    areaServed: ["Hyderabad", "Telangana", "Andhra Pradesh", "Karnataka", "Tamil Nadu", "Maharashtra", "Delhi", "India"],
  });

  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
        { name: "Domestic Courier", path: "/services/domestic-courier" },
      ]}
      extraSchemas={[serviceSchema]}
    >
      {children}
    </SeoLayout>
  );
}
