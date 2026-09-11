import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";
import { buildIndividualServiceSchema } from "@/lib/seo/schema";

const seo = pageSeo.internationalCourierUk;

export const metadata: Metadata = createSeoMetadata(seo);

export default function HyderabadToUkLayout({ children }: { children: React.ReactNode }) {
  const serviceSchema = buildIndividualServiceSchema({
    title: "International Courier from Hyderabad to UK",
    description: seo.description,
    path: seo.path,
    image: "/international_courier.png",
    serviceType: "Hyderabad to UK Courier Delivery",
    areaServed: ["Hyderabad", "UK"],
  });

  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
        { name: "International Courier", path: "/services/international-courier" },
        { name: "Hyderabad to UK", path: "/services/international-courier/hyderabad-to-uk" },
      ]}
      extraSchemas={[serviceSchema]}
    >
      {children}
    </SeoLayout>
  );
}
