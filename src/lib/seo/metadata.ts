import type { Metadata } from "next";
import { business } from "@/lib/config";
import { absoluteUrl, LOCALE, SITE_NAME, SITE_URL, THEME_COLOR } from "./site";

export type PageSeoConfig = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
  ogType?: "website" | "article";
};

const DEFAULT_OG_IMAGE = "/logo.png";

export function createPageMetadata({
  title,
  description,
  path,
  keywords = business.seo.keywords,
  noIndex = false,
  ogType = "website",
}: PageSeoConfig): Metadata {
  const canonical = absoluteUrl(path);
  const ogImage = absoluteUrl(DEFAULT_OG_IMAGE);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
      languages: {
        [LOCALE.split("_")[0]]: canonical,
        "x-default": canonical,
      },
    },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: ogType,
      locale: LOCALE.replace("_", "-"),
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 512,
          height: 512,
          alt: `${SITE_NAME} — Courier Services in Hyderabad`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    other: {
      "theme-color": THEME_COLOR,
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "apple-mobile-web-app-title": SITE_NAME,
      "format-detection": "telephone=yes",
    },
  };
}

const homePageMeta = createPageMetadata({
  title: business.seo.defaultTitle,
  description: business.seo.defaultDescription,
  path: "/",
});

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: business.seo.defaultTitle,
    template: `%s | ${SITE_NAME}`,
  },
  description: business.seo.defaultDescription,
  keywords: business.seo.keywords,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Courier Service",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-icon.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
  alternates: homePageMeta.alternates,
  robots: homePageMeta.robots,
  openGraph: homePageMeta.openGraph,
  twitter: homePageMeta.twitter,
  other: homePageMeta.other,
};
