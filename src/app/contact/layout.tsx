import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";

const seo = pageSeo.contact;

export const metadata: Metadata = createSeoMetadata(seo);

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Contact", path: "/contact" },
      ]}
    >
      {children}
    </SeoLayout>
  );
}
