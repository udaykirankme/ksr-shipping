import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";

const seo = pageSeo.restrictedItems;

export const metadata: Metadata = createSeoMetadata(seo);

export default function RestrictedItemsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Restricted Items", path: "/restricted-items" },
      ]}
    >
      {children}
    </SeoLayout>
  );
}
