"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type AnalyticsClickEventName =
  | "call_click"
  | "whatsapp_click"
  | "email_click"
  | "quote_click"
  | "maps_click"
  | "review_click";

const RAW_GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GA_MEASUREMENT_ID = RAW_GA_ID ? RAW_GA_ID.trim() : "";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

function getCleanPagePath(pathname: string | null | undefined): string {
  if (!pathname) return "/";
  if (pathname === "/track" || pathname === "/track/") return "/track";
  if (pathname.startsWith("/track/")) return "/track/[id]";
  return pathname;
}

function getLinkLocation(
  anchor: Element,
  cleanPath: string
): "header" | "footer" | "hero" | undefined {
  if (anchor.closest("header")) return "header";
  if (anchor.closest("footer")) return "footer";
  if (cleanPath === "/" && anchor.closest("main > div > section:first-of-type")) {
    return "hero";
  }
  return undefined;
}

function classifyLinkEvent(rawHref: string): AnalyticsClickEventName | null {
  const trimmed = rawHref.trim();
  if (!trimmed || trimmed === "#") return null;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("tel:")) return "call_click";
  if (lower.startsWith("mailto:")) return "email_click";

  let url: URL;
  try {
    url = new URL(trimmed, window.location.origin);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const path = url.pathname;

  if (host === "wa.me" || host.endsWith(".wa.me") || host === "api.whatsapp.com") {
    return "whatsapp_click";
  }
  if (host === "mail.google.com" && path.startsWith("/mail")) {
    return "email_click";
  }
  if (
    url.origin === window.location.origin &&
    (path === "/get-quotation" || path === "/get-quotation/")
  ) {
    return "quote_click";
  }
  if (
    host === "maps.app.goo.gl" ||
    ((host === "google.com" || host === "www.google.com" || host === "maps.google.com") &&
      path.startsWith("/maps"))
  ) {
    return "maps_click";
  }
  if (host === "g.page" && path.startsWith("/r/")) {
    return "review_click";
  }

  return null;
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !IS_PRODUCTION || isAdmin) return;

    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      return;
    }

    if (typeof window.gtag !== "function") return;

    const cleanPath = getCleanPagePath(pathname);
    const cleanLocation = `${window.location.origin}${cleanPath}`;
    window.gtag("set", {
      page_path: cleanPath,
      page_location: cleanLocation,
    });
    window.gtag("event", "page_view", {
      page_path: cleanPath,
      page_location: cleanLocation,
    });
  }, [pathname, isAdmin]);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !IS_PRODUCTION || isAdmin) return;

    const handleDocumentClick = (event: MouseEvent) => {
      if (typeof window.gtag !== "function") return;
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!anchor) return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref) return;

      const eventName = classifyLinkEvent(rawHref);
      if (!eventName) return;

      const cleanPath = getCleanPagePath(window.location.pathname);
      if (cleanPath.startsWith("/admin")) return;

      const linkLocation = getLinkLocation(anchor, cleanPath);
      const params: Record<string, string> = { page_path: cleanPath };
      if (linkLocation) {
        params.link_location = linkLocation;
      }

      window.gtag("event", eventName, params);
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
  }, [isAdmin]);

  if (!GA_MEASUREMENT_ID || !IS_PRODUCTION || isAdmin) {
    return null;
  }

  return (
    <>
      <Script
        id="google-analytics-gtag"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          var p = window.location.pathname || '/';
          var cleanPath = (p === '/track' || p === '/track/') ? '/track' : (p.indexOf('/track/') === 0 ? '/track/[id]' : p);
          var cleanLocation = window.location.origin + cleanPath;
          gtag('config', ${JSON.stringify(GA_MEASUREMENT_ID)}, {
            send_page_view: false,
            page_path: cleanPath,
            page_location: cleanLocation
          });
          gtag('event', 'page_view', {
            page_path: cleanPath,
            page_location: cleanLocation
          });
        `}
      </Script>
    </>
  );
}
