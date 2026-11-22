import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES, SITEMAP_IMAGES, absoluteUrl } from "@/lib/seo/site";

// Fixed per-route last modified dates from route source file commit history
const ROUTE_LAST_MODIFIED: Record<string, string> = {
  "/": "2026-11-22",
  "/about": "2026-11-22",
  "/services": "2026-11-22",
  "/services/international-courier": "2026-11-18",
  "/services/international-courier/hyderabad-to-usa": "2026-11-18",
  "/services/international-courier/hyderabad-to-uk": "2026-11-18",
  "/services/domestic-courier": "2026-11-18",
  "/services/food-shipping": "2026-11-18",
  "/services/medicine-shipping": "2026-11-18",
  "/services/fragile-shipping": "2026-11-18",
  "/services/document-shipping": "2026-11-18",
  "/services/commercial-shipping": "2026-11-18",
  "/services/shipment-insurance": "2026-11-22",
  "/services/free-packing-and-pickup": "2026-11-22",
  "/get-quotation": "2026-11-18",
  "/track": "2026-11-18",
  "/why-choose-us": "2026-11-22",
  "/contact": "2026-11-18",
  "/support": "2026-11-18",
  "/faq": "2026-11-22",
  "/restricted-items": "2026-11-18",
  "/privacy-policy": "2026-11-18",
  "/terms": "2026-11-22",
};

// Fallback constant date for routes without a separate commit record
const FALLBACK_CONSTANT_DATE = "2026-11-18";

export default function sitemap(): MetadataRoute.Sitemap {
  const imageEntries = SITEMAP_IMAGES.map((image) => absoluteUrl(image.path));

  return PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(ROUTE_LAST_MODIFIED[route.path] ?? FALLBACK_CONSTANT_DATE),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    ...(route.path === "/" || route.path === "/services"
      ? {
          images: imageEntries,
        }
      : {}),
  }));
}
