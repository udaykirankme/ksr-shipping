import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";

const seo = pageSeo.terms;

export const metadata: Metadata = createSeoMetadata(seo);

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Terms & Conditions", path: "/terms" },
      ]}
    >
      {children}
    </SeoLayout>
  );
}
