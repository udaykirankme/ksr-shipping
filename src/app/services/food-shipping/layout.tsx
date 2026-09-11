import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";
import { buildIndividualServiceSchema } from "@/lib/seo/schema";

const seo = pageSeo.foodShipping;

export const metadata: Metadata = createSeoMetadata(seo);

export default function FoodShippingLayout({ children }: { children: React.ReactNode }) {
  const serviceSchema = buildIndividualServiceSchema({
    title: "Food & Homemade Sweets Courier Services",
    description: seo.description,
    path: seo.path,
    image: "/bg.png",
    serviceType: "Specialized Food-Grade Packaging & International Food Shipping",
    areaServed: ["Hyderabad", "USA", "UK", "Canada", "Australia", "UAE", "Singapore", "New Zealand", "Europe"],
  });

  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
        { name: "Food Shipping", path: "/services/food-shipping" },
      ]}
      extraSchemas={[serviceSchema]}
    >
      {children}
    </SeoLayout>
  );
}
