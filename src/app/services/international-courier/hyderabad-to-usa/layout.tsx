import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";
import { buildIndividualServiceSchema } from "@/lib/seo/schema";

const seo = pageSeo.internationalCourierUsa;

export const metadata: Metadata = createSeoMetadata(seo);

export default function HyderabadToUsaLayout({ children }: { children: React.ReactNode }) {
  const serviceSchema = buildIndividualServiceSchema({
    title: "International Courier from Hyderabad to USA",
    description: seo.description,
    path: seo.path,
    image: "/international_courier.png",
    serviceType: "Hyderabad to USA Courier Delivery",
    areaServed: ["Hyderabad", "USA"],
  });

  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
        { name: "International Courier", path: "/services/international-courier" },
        { name: "Hyderabad to USA", path: "/services/international-courier/hyderabad-to-usa" },
      ]}
      extraSchemas={[serviceSchema]}
    >
      {children}
    </SeoLayout>
  );
}
