import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";

const seo = pageSeo.about;

export const metadata: Metadata = createSeoMetadata(seo);

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "About Us", path: "/about" },
      ]}
    >
      {children}
    </SeoLayout>
  );
}
