import { business } from "@/lib/config";
import type { FaqItem } from "@/lib/data/faq";
import { absoluteUrl, SITE_NAME, SITE_URL } from "./site";

const PHONE_E164 = business.phone.replace(/\s+/g, "");

export function getPostalAddress() {
  return {
    "@type": "PostalAddress" as const,
    streetAddress: business.address,
    addressLocality: business.locality,
    addressRegion: business.region,
    postalCode: business.postalCode,
    addressCountry: business.country,
  };
}

export function getGeoCoordinates() {
  return {
    "@type": "GeoCoordinates" as const,
    latitude: business.geo.latitude,
    longitude: business.geo.longitude,
  };
}

export function getOpeningHoursSpecification() {
  return [
    {
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      opens: "09:00",
      closes: "21:00",
    },
  ];
}

export function getSameAsLinks(): string[] {
  return [
    business.social.instagram,
    business.social.facebook,
    business.social.linkedin,
    business.social.youtube,
    business.googleMapsUrl,
    business.googleReviewUrl,
  ].filter(Boolean);
}

export function buildOrganizationSchema() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(business.logoUrl),
      width: 512,
      height: 512,
    },
    image: absoluteUrl(business.logoUrl),
    email: business.email,
    telephone: PHONE_E164,
    address: getPostalAddress(),
    sameAs: getSameAsLinks(),
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: PHONE_E164,
        contactType: "customer service",
        email: business.email,
        areaServed: ["IN", "Hyderabad", "Telangana"],
        availableLanguage: ["English", "Hindi", "Telugu"],
      },
    ],
  };
}

export function buildLocalBusinessSchema() {
  return {
    "@type": ["LocalBusiness", "CourierService"],
    "@id": `${SITE_URL}/#localbusiness`,
    name: SITE_NAME,
    url: SITE_URL,
    image: absoluteUrl(business.logoUrl),
    logo: absoluteUrl(business.logoUrl),
    telephone: PHONE_E164,
    email: business.email,
    priceRange: "$$",
    address: getPostalAddress(),
    geo: getGeoCoordinates(),
    hasMap: business.googleMapsUrl,
    openingHoursSpecification: getOpeningHoursSpecification(),
    sameAs: getSameAsLinks(),
    areaServed: [
      { "@type": "City", name: "Hyderabad" },
      { "@type": "AdministrativeArea", name: "Telangana" },
      { "@type": "Country", name: "India" },
    ],
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
    knowsAbout: [
      "International Courier",
      "Domestic Courier",
      "Medicine Shipping",
      "Document Shipping",
      "Commercial Shipping",
      "Fragile Shipping",
      "Logistics",
    ],
  };
}

export function buildWebSiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: business.seo.defaultDescription,
    inLanguage: "en-IN",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/track?id={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildWebPageSchema({
  path,
  title,
  description,
  breadcrumb,
}: {
  path: string;
  title: string;
  description: string;
  breadcrumb?: { name: string; path: string }[];
}) {
  const url = absoluteUrl(path);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: title,
      description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#localbusiness` },
      inLanguage: "en-IN",
    },
  ];

  if (breadcrumb && breadcrumb.length > 0) {
    graph.push(buildBreadcrumbSchema(breadcrumb));
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function buildBreadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildFaqPageSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export type ServiceSchemaItem = {
  id: string;
  title: string;
  overview: string;
  image: string;
};

export function buildServiceCatalogSchema(services: ServiceSchemaItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: `${SITE_NAME} Courier Services`,
    itemListElement: services.map((service, index) => ({
      "@type": "Offer",
      position: index + 1,
      itemOffered: {
        "@type": "Service",
        "@id": `${SITE_URL}/services#${service.id}`,
        name: service.title,
        description: service.overview,
        image: absoluteUrl(service.image),
        provider: { "@id": `${SITE_URL}/#localbusiness` },
        areaServed: ["Hyderabad", "Telangana", "India"],
        serviceType: service.title,
      },
    })),
  };
}

export function buildSiteNavigationSchema() {
  const navItems = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/why-choose-us" },
    { name: "Services", path: "/services" },
    { name: "Support", path: "/support" },
    { name: "Track Shipment", path: "/track" },
    { name: "Contact Us", path: "/contact" },
  ];

  return navItems.map((item) => ({
    "@type": "SiteNavigationElement",
    name: item.name,
    url: absoluteUrl(item.path),
  }));
}

export function buildGlobalSchemaGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationSchema(),
      buildLocalBusinessSchema(),
      buildWebSiteSchema(),
      ...buildSiteNavigationSchema(),
    ],
  };
}
