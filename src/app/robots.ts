import type { MetadataRoute } from "next";
import { business } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = business.siteUrl.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/health"],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "Google-Extended",
          "Applebot-Extended",
          "Bingbot",
          "OAI-SearchBot",
        ],
        allow: "/",
        disallow: ["/api/", "/admin/", "/health"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
