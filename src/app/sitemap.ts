import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES, SITEMAP_IMAGES, absoluteUrl } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const imageEntries = SITEMAP_IMAGES.map((image) => absoluteUrl(image.path));

  return PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    ...(route.path === "/" || route.path === "/services"
      ? {
          images: imageEntries,
        }
      : {}),
  }));
}
