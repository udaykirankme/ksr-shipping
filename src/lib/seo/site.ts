import { business } from "@/lib/config";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://ksrshipping.com";

export const SITE_NAME = business.name;
export const THEME_COLOR = "#FF6A00";
export const LOCALE = "en_IN";

export const PUBLIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/services", priority: 0.9, changeFrequency: "monthly" as const },
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
  { path: "/international_courier.png", title: "International Courier Service" },
  { path: "/domestic_courier.png", title: "Domestic Courier Service" },
  { path: "/medicine_shipping.png", title: "Medicine Shipping Service" },
  { path: "/fragile_shipping.png", title: "Fragile Shipping Service" },
  { path: "/express_document_delivery.png", title: "Express Document Delivery" },
  { path: "/commercial_shipping.png", title: "Commercial Shipping Service" },
  { path: "/bg.png", title: `${business.name} Hero Illustration` },
];

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
