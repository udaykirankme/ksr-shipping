import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";

const seo = pageSeo.whyChooseUs;

export const metadata: Metadata = createSeoMetadata(seo);

export default function WhyChooseUsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Why Choose Us", path: "/why-choose-us" },
      ]}
    >
      {children}
    </SeoLayout>
  );
}
