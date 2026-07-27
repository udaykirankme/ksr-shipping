import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { FAQS } from "@/lib/data/faq";
import { pageSeo } from "@/lib/seo/pages";
import { buildFaqPageSchema } from "@/lib/seo/schema";

const seo = pageSeo.faq;

export const metadata: Metadata = createSeoMetadata(seo);

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "FAQ", path: "/faq" },
      ]}
      extraSchemas={[buildFaqPageSchema(FAQS)]}
    >
      {children}
    </SeoLayout>
  );
}
