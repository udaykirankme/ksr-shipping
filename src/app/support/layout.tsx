import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";

const seo = pageSeo.support;

export const metadata: Metadata = createSeoMetadata(seo);

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Support", path: "/support" },
      ]}
    >
      {children}
    </SeoLayout>
  );
}
