export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQS: FaqItem[] = [
  {
    question: "How do I track my shipment?",
    answer:
      "You can track your shipment using the tracking number provided at the time of booking. Simply enter the number in the tracking widget on our homepage or the Track Shipment page. You will see real-time status updates regardless of which courier partner is handling your delivery.",
  },
  {
    question: "What are the restricted items for international shipping?",
    answer:
      "Restricted items generally include flammable liquids, explosives, corrosives, live animals, cash, and illegal substances. Different countries may have additional specific restrictions. Please check our Restricted Items page or contact support if you are unsure about a specific item.",
  },
  {
    question: "How long does domestic delivery take?",
    answer:
      "Domestic delivery typically takes 1-2 business days for major metropolitan areas, and 3-5 business days for remote or regional locations. We also offer priority express services for urgent shipments.",
  },
  {
    question: "Do you offer doorstep pickup?",
    answer:
      "Yes! We offer free doorstep pickup services for both domestic and international shipments. You can schedule a pickup online or by calling our customer support team.",
  },
  {
    question: "What happens if I am not home to receive my package?",
    answer:
      "If you are unavailable, our courier partner will typically attempt delivery up to two more times on subsequent business days. Alternatively, they may leave a slip with instructions to collect the package from the nearest local facility.",
  },
  {
    question: "How is the shipping cost calculated?",
    answer:
      "Shipping cost is calculated based on the greater of the actual weight or the volumetric weight (Length x Width x Height) of your parcel, as well as the destination and selected service speed.",
  },
  {
    question: "Do you provide packaging materials?",
    answer:
      "We provide standard packaging materials like courier flyers and boxes for free. For specialized needs like fragile item packing or food-grade packing, we offer professional packaging services for a nominal fee to ensure the utmost safety.",
  },
  {
    question: "Can I ship medicines internationally?",
    answer:
      "Yes, you can ship medicines internationally, but it requires a valid doctor's prescription, the original medical bill, and sometimes a letter of authorization. Please contact us beforehand so we can guide you through the required documentation.",
  },
  {
    question: "Is there insurance for my shipments?",
    answer:
      "Basic liability coverage is included for all shipments. For high-value items, we strongly recommend purchasing additional transit insurance, which we can arrange at the time of booking for complete peace of mind.",
  },
  {
    question: "What should I do if my shipment is delayed?",
    answer:
      "While we strive for 100% on-time delivery, delays can occasionally happen due to weather, customs clearance, or operational issues. If your shipment is delayed past the estimated delivery date, please reach out to our support team and we will prioritize resolving the issue.",
  },
];
