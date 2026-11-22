import { business } from "@/lib/config";

export const SITE_URL = business.siteUrl.replace(/\/$/, "");

export const SITE_NAME = business.name;
export const THEME_COLOR = "#FF6A00";
export const LOCALE = "en_IN";

export const PUBLIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/services", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/services/international-courier", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/services/international-courier/hyderabad-to-usa", priority: 0.85, changeFrequency: "monthly" as const },
  { path: "/services/international-courier/hyderabad-to-uk", priority: 0.85, changeFrequency: "monthly" as const },
  { path: "/services/domestic-courier", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/services/food-shipping", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/services/medicine-shipping", priority: 0.85, changeFrequency: "weekly" as const },
  { path: "/services/fragile-shipping", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/services/document-shipping", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/services/commercial-shipping", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/services/shipment-insurance", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/services/free-packing-and-pickup", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/get-quotation", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/track", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/why-choose-us", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/support", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/restricted-items", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
];

export const SITEMAP_IMAGES = [
  { path: "/logo.png", title: `${business.name} Logo` },
  { path: "/logo-square.png", title: `${business.name} Square Logo` },
  { path: "/international_courier.png", title: "International Courier Service" },
  { path: "/domestic_courier.png", title: "Domestic Courier Service" },
  { path: "/medicine_shipping.png", title: "Medicine Shipping Service" },
  { path: "/fragile_shipping.png", title: "Fragile Shipping Service" },
  { path: "/express_document_delivery.png", title: "Express Document Delivery" },
  { path: "/commercial_shipping.png", title: "Commercial Shipping Service" },
  { path: "/shipment insurance.png", title: "Shipment Insurance Service" },
  { path: "/free packing.png", title: "Free Packing & Doorstep Pickup" },
  { path: "/bg.webp", title: `${business.name} Hero Illustration` },
];

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
