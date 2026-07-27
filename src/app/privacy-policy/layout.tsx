import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";

const seo = pageSeo.privacyPolicy;

export const metadata: Metadata = createSeoMetadata(seo);

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Privacy Policy", path: "/privacy-policy" },
      ]}
    >
      {children}
    </SeoLayout>
  );
}
