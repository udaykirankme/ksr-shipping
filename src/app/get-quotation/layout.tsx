import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";

const seo = pageSeo.getQuotation;

export const metadata: Metadata = createSeoMetadata(seo);

export default function GetQuotationLayout({ children }: { children: React.ReactNode }) {
  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Get Quotation", path: "/get-quotation" },
      ]}
    >
      {children}
    </SeoLayout>
  );
}
