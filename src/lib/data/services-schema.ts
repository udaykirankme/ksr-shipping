export type ServiceSchemaItem = {
  id: string;
  title: string;
  overview: string;
  image: string;
};

export const SERVICE_SCHEMA_ITEMS: ServiceSchemaItem[] = [
  {
    id: "international-courier",
    title: "International Courier",
    overview:
      "Seamless global shipping to over 150 countries. We handle all customs documentation, international routing, and clearance to ensure your package arrives without delays or unexpected fees.",
    image: "/international_courier.png",
  },
  {
    id: "domestic-courier",
    title: "Domestic Courier",
    overview:
      "Fast, reliable, and secure shipping across every state, city, and remote village in India. Choose between our Domestic Air Courier service for urgent deliveries or our Domestic Road Courier service for cost-effective transportation. We help you select the best option based on your shipment's urgency, destination, and budget.",
    image: "/domestic_courier.png",
  },
  {
    id: "food-shipping",
    title: "Food & Homemade Sweets Shipping",
    overview:
      "Specialized food-grade packaging designed to reduce transit damage and maintain hygiene for homemade sweets, snacks, pickles, and dry spices sent from Hyderabad to the USA, UK, Canada, Australia, and worldwide.",
    image: "/bg.webp",
  },
  {
    id: "medicine-shipping",
    title: "Medicine Shipping",
    overview:
      "Temperature-controlled and priority handling for prescription medicines, medical samples, and health essentials. We ensure strict compliance with health regulations.",
    image: "/medicine_shipping.png",
  },
  {
    id: "fragile-shipping",
    title: "Fragile Shipping",
    overview:
      "Specialized packing with premium bubble wrap, foam peanuts, and reinforced double-walled boxes to guarantee the safety of electronics, glassware, and artwork.",
    image: "/fragile_shipping.png",
  },
  {
    id: "document-delivery",
    title: "Express Document Delivery",
    overview:
      "Secure delivery of important documents with fast, reliable and trackable service. We ensure your critical paperwork reaches its destination safely and on time.",
    image: "/express_document_delivery.png",
  },
  {
    id: "commercial-shipping",
    title: "Commercial Shipping",
    overview:
      "B2B logistics tailored for scale. Bulk shipment solutions, warehouse pickups, regular dispatch scheduling, and discounted corporate rates.",
    image: "/commercial_shipping.png",
  },
  {
    id: "shipment-insurance",
    title: "Shipment Insurance",
    overview:
      "Clear transit insurance for domestic, commercial and international shipments booked through established courier partners.",
    image: "/shipment insurance.png",
  },
  {
    id: "free-packing-and-pickup",
    title: "Free Packing & Doorstep Pickup",
    overview:
      "Convenient zero-cost doorstep collection and expert packing in standard cartons, multi-layer leak-proof wraps for food and pickles, and shock cushioning for fragile items.",
    image: "/free packing.png",
  },
];
