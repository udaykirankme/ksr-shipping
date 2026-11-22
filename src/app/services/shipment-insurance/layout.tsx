import type { Metadata } from "next";
import { SeoLayout, createSeoMetadata } from "@/components/seo/SeoLayout";
import { pageSeo } from "@/lib/seo/pages";
import { buildIndividualServiceSchema, buildFaqPageSchema } from "@/lib/seo/schema";

const seo = pageSeo.shipmentInsurance;

export const metadata: Metadata = createSeoMetadata(seo);

const faqs = [
  {
    question: "Is transit insurance included for domestic parcels?",
    answer:
      "Yes. For domestic courier shipments under 30 kg, complimentary transit insurance coverage up to ₹30,000 is included against transit loss or damage.",
  },
  {
    question: "What are the requirements for commercial or B2B consignment insurance?",
    answer:
      "Commercial and B2B shipments can have full insurance coverage, which may require submission of a valid commercial product invoice and adherence to applicable courier partner terms.",
  },
  {
    question: "How is international shipment insurance handled?",
    answer:
      "International insurance coverage is available subject to destination carrier policies, formal damage assessment, and applicable claim conditions.",
  },
  {
    question: "Does KSR Shipping Services operate delivery networks directly?",
    answer:
      "No. KSR collects, professionally packs, and books shipments through established courier partners (such as DHL, FedEx, UPS, DTDC, and Delhivery); KSR does not operate delivery networks directly.",
  },
  {
    question: "Where can I review specific claim procedures or coverage conditions?",
    answer:
      "To review specific terms, documentation requirements, or coverage conditions for your shipment before booking, please contact KSR directly via phone or WhatsApp.",
  },
  {
    question: "What should I send if my shipment is damaged?",
    answer:
      "If a shipment arrives damaged, please send a few photos and a short video that clearly show the shipping label, the AWB number, and the damaged parts. Please call or WhatsApp us on +91 99638 14267 to start the process.",
  },
];

export default function ShipmentInsuranceLayout({ children }: { children: React.ReactNode }) {
  const serviceSchema = buildIndividualServiceSchema({
    title: "Shipment Insurance Coverage",
    description: seo.description,
    path: seo.path,
    image: "/shipment insurance.png",
    serviceType: "Courier Transit Insurance Coverage",
    areaServed: ["Hyderabad", "Telangana", "India", "USA", "UK", "Canada", "Australia", "UAE", "Singapore", "New Zealand", "Europe"],
  });

  const faqSchema = buildFaqPageSchema(faqs);

  return (
    <SeoLayout
      seo={seo}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
        { name: "Shipment Insurance", path: "/services/shipment-insurance" },
      ]}
      extraSchemas={[serviceSchema, faqSchema]}
    >
      {children}
    </SeoLayout>
  );
}
