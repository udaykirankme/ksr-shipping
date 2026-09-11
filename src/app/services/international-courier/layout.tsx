import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";
import { buildIndividualServiceSchema } from "@/lib/seo/schema";

const seo = pageSeo.internationalCourier;

export const metadata: Metadata = createSeoMetadata(seo);

export default function InternationalCourierLayout({ children }: { children: React.ReactNode }) {
  const serviceSchema = buildIndividualServiceSchema({
    title: "International Courier Services",
    description: seo.description,
    path: seo.path,
    image: "/international_courier.png",
    serviceType: "International Parcel & Courier Delivery",
    areaServed: ["Hyderabad", "USA", "UK", "Canada", "Australia", "UAE", "Singapore", "New Zealand", "Germany", "France"],
  });

  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
        { name: "International Courier", path: "/services/international-courier" },
      ]}
      extraSchemas={[serviceSchema]}
    >
      {children}
    </SeoLayout>
  );
}
