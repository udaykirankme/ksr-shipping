import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";

const seo = pageSeo.track;

export const metadata: Metadata = createSeoMetadata(seo);

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Track Shipment", path: "/track" },
      ]}
    >
      {children}
    </SeoLayout>
  );
}
