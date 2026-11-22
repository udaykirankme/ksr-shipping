import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";
import { buildIndividualServiceSchema, buildFaqPageSchema } from "@/lib/seo/schema";

const seo = pageSeo.freePackingAndPickup;

export const metadata: Metadata = createSeoMetadata(seo);

const faqs = [
  {
    question: "Is doorstep pickup really free across Hyderabad?",
    answer:
      "Yes. KSR Shipping Services provides 100% free doorstep collection from your home or office across Hyderabad. There are no extra pickup fees.",
  },
  {
    question: "Are packaging materials and packing services free of charge?",
    answer:
      "Yes. Professional packaging—including standard corrugated cartons, multilayer food-grade packing for sweets and pickles, and cushioning for fragile goods—is completely free with our doorstep pickup service.",
  },
  {
    question: "How are liquids, pickles, and food items packed to prevent leakage?",
    answer:
      "Liquids, pickles, and food items receive specialized multilayer packaging engineered to prevent leakage, oil seepage, and staining during international and domestic transit.",
  },
  {
    question: "What packing is provided for fragile items?",
    answer:
      "Fragile and delicate items are packed using quality protective cushioning, shock-absorbing bubble wrap, and sturdy corrugated cartons to protect them against transit vibration.",
  },
  {
    question: "Does KSR operate the delivery transportation fleets directly?",
    answer:
      "No. KSR collects, expertly packs, and books shipments through established courier partner networks (including DHL, FedEx, UPS, DTDC, and Delhivery); KSR does not operate delivery networks directly.",
  },
  {
    question: "Can I ship from outside Hyderabad?",
    answer:
      "Domestic shipments can also be booked from other states. International shipments are available from Hyderabad only. Contact KSR to arrange your shipment.",
  },
];

export default function FreePackingAndPickupLayout({ children }: { children: React.ReactNode }) {
  const serviceSchema = buildIndividualServiceSchema({
    title: "Free Packing & Doorstep Pickup",
    description: seo.description,
    path: seo.path,
    image: "/free packing.png",
    serviceType: "Free Doorstep Pickup & Professional Courier Packing",
    areaServed: ["Hyderabad", "Telangana", "India", "USA", "UK", "Canada", "Australia", "UAE", "Singapore", "New Zealand", "Europe"],
  });

  const faqSchema = buildFaqPageSchema(faqs);

  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
        { name: "Free Packing & Pickup", path: "/services/free-packing-and-pickup" },
      ]}
      extraSchemas={[serviceSchema, faqSchema]}
    >
      {children}
    </SeoLayout>
  );
}
