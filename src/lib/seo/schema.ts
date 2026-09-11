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
        areaServed: ["IN", "Hyderabad", "Telangana", "Andhra Pradesh", "Karnataka", "Tamil Nadu", "Maharashtra", "Delhi", "USA", "UK", "Canada", "Australia", "UAE", "Singapore", "New Zealand", "Europe"],
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
      { "@type": "AdministrativeArea", name: "Andhra Pradesh" },
      { "@type": "AdministrativeArea", name: "Karnataka" },
      { "@type": "AdministrativeArea", name: "Tamil Nadu" },
      { "@type": "AdministrativeArea", name: "Maharashtra" },
      { "@type": "AdministrativeArea", name: "Delhi" },
      { "@type": "Country", name: "India" },
      { "@type": "Country", name: "USA" },
      { "@type": "Country", name: "UK" },
      { "@type": "Country", name: "Canada" },
      { "@type": "Country", name: "Australia" },
      { "@type": "Country", name: "UAE" },
      { "@type": "Country", name: "Singapore" },
      { "@type": "Country", name: "New Zealand" },
    ],
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
    knowsAbout: [
      "International Courier Services",
      "Domestic Courier Pan India",
      "Free Doorstep Pickup Courier Hyderabad",
      "Food-Grade Packing for Sweets and Pickles",
      "Prescription Medicine Courier",
      "Urgent Healthcare Logistics",
      "Fragile and Electronics Item Packaging",
      "Confidential Legal Document and Passport Delivery",
      "Commercial and B2B Freight Logistics",
      "Customs Clearance and International Documentation",
      "Real-Time Parcel Tracking",
      "Affordable Courier to USA, UK, Canada, Australia, UAE, Singapore, Europe",
      "Door-to-door Express Shipping",
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

export const DEFAULT_SERVICES_SCHEMA: ServiceSchemaItem[] = [
  {
    id: "international-courier",
    title: "International Courier Services",
    overview: "Fast, reliable worldwide shipping to over 150 countries including USA, UK, Canada, Australia, UAE, Singapore, and Europe. Complete customs clearance paperwork assistance and door-to-door delivery.",
    image: "/international_courier.png",
  },
  {
    id: "domestic-courier",
    title: "Domestic Courier Services (Pan-India)",
    overview: "Comprehensive domestic shipping across India covering all states, cities, and pin codes. Features both Domestic Air Courier for urgent deliveries and Domestic Road Courier for economical transportation with verified doorstep pickup.",
    image: "/domestic_courier.png",
  },
  {
    id: "medicine-shipping",
    title: "Medicine Shipping & Healthcare Logistics",
    overview: "Safe, compliant, temperature-aware and prioritized transportation of prescription medicines, critical healthcare essentials, and emergency medical supplies worldwide.",
    image: "/medicine_shipping.png",
  },
  {
    id: "fragile-shipping",
    title: "Fragile Shipping & Delicate Cargo Protection",
    overview: "Reinforced multi-layer packaging, heavy-duty bubble wrap, foam cushioning, and custom boxing for fragile, delicate, glassware, and sensitive electronics.",
    image: "/fragile_shipping.png",
  },
  {
    id: "commercial-shipping",
    title: "Commercial Shipping & Enterprise B2B Logistics",
    overview: "Smart B2B logistics, palletized shipments, warehouse pickups, scheduled dispatch, and discounted corporate enterprise shipping solutions.",
    image: "/commercial_shipping.png",
  },
  {
    id: "document-shipping",
    title: "Express Document Delivery",
    overview: "Confidential, tamper-evident, and urgent courier delivery of legal documents, passports, contracts, and business certificates with signature upon delivery.",
    image: "/express_document_delivery.png",
  },
  {
    id: "food-grade-packing",
    title: "Premium Food-Grade Packing for Sweets, Snacks & Pickles",
    overview: "Specialized, certified food-grade packaging materials engineered to keep homemade treats, traditional sweets, spices, and pickles fresh, hygienic, and leak-proof during international transit.",
    image: "/bg.png",
  },
  {
    id: "free-doorstep-pickup",
    title: "100% Free Doorstep Courier Pickup",
    overview: "Convenient, zero-cost doorstep collection directly from your home or office in Hyderabad and surrounding areas, eliminating branch queues.",
    image: "/bg.png",
  },
];

export function buildServiceCatalogSchema(services: ServiceSchemaItem[] = DEFAULT_SERVICES_SCHEMA) {
  return {
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
        areaServed: ["Hyderabad", "Telangana", "India", "USA", "UK", "Canada", "Australia", "UAE", "Singapore", "New Zealand", "Europe"],
        serviceType: service.title,
      },
    })),
  };
}

export function buildWhyChooseUsItemListSchema() {
  const points = [
    { name: "Convenient Doorstep Pickup", desc: "100% free pickup directly from your home or office, avoiding long courier branch queues." },
    { name: "Priority Express Delivery", desc: "Lightning-fast, on-time delivery across India and worldwide through priority routing networks." },
    { name: "Premium Food-Grade Packing", desc: "Specialized food-grade materials keeping homemade treats, sweets, and pickles clean, fresh, and protected." },
    { name: "Real-Time Shipment Tracking", desc: "Single unified tracking number to track parcels 24/7 across all delivery partners." },
    { name: "Safe & Secure Handling", desc: "Strict security protocols, monitored warehousing, and comprehensive transit guidelines." },
    { name: "Advanced Protection for Fragile Shipments", desc: "Extra cushioning, shock absorption, and secure packaging best practices for delicate goods." },
    { name: "Dedicated Customer Support", desc: "Fast personal assistance via Phone, WhatsApp, and Email for all tracking and courier queries." },
    { name: "Trusted Courier Network", desc: "Intelligent partnerships with DHL, FedEx, UPS, DTDC, Delhivery, Shadowfax, and Ekart." },
    { name: "Global Shipping & Customs Clearance", desc: "End-to-end international courier to 150+ countries with complex customs documentation handled." },
    { name: "Business Logistics Solutions", desc: "Tailored bulk shipping, warehouse dispatches, and end-to-end enterprise B2B solutions." },
    { name: "Secure Medicine Shipping", desc: "Compliant, temperature-aware, and urgent transportation of prescription medicines and healthcare supplies subject to destination regulatory requirements." },
    { name: "Reliable Door-to-Door Delivery", desc: "Dedicated logistics support with regular milestone tracking updates from collection to final destination." }
  ];

  return {
    "@type": "ItemList",
    name: "Why Choose KSR Shipping Services",
    description: "Core differentiators and service highlights of KSR Shipping Services.",
    itemListElement: points.map((pt, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: pt.name,
      description: pt.desc,
    })),
  };
}

export function buildHomeFaqSchema() {
  const faqs = [
    {
      q: "Does KSR Shipping Services provide free doorstep pickup?",
      a: "Yes, KSR Shipping Services provides complimentary doorstep pickup across Hyderabad and surrounding areas. You can schedule a pickup online at ksrshipping.com or call +91 99638 14267."
    },
    {
      q: "Can I send homemade food, sweets, and pickles to the USA, UK, or other countries?",
      a: "Yes, we handle international shipping for non-perishable homemade foods, traditional sweets, snacks, and pickles. We use specialized food-grade packaging materials engineered to protect against transit damage and maintain hygiene en route to USA, UK, Canada, Australia, UAE, Europe, and other destinations."
    },
    {
      q: "Can I courier prescription medicines internationally through KSR Shipping?",
      a: "Yes, eligible prescription medicines can be shipped internationally subject to destination customs and healthcare documentation requirements, including a valid doctor's prescription, commercial chemist bill, and identification."
    },
    {
      q: "Which countries does KSR Shipping deliver to?",
      a: "KSR Shipping Services delivers globally to major international destinations, including USA, UK, Canada, Australia, UAE, Singapore, New Zealand, and European countries, alongside comprehensive pan-India domestic delivery."
    },
    {
      q: "How can I track my courier parcel?",
      a: "You can track your shipment 24/7 in real-time by entering your tracking ID at ksrshipping.com/track."
    },
    {
      q: "How does KSR Shipping protect fragile and delicate items?",
      a: "We utilize multi-layer protective packaging, bubble cushioning, corner protectors, and reinforced corrugated boxes to provide enhanced protection for delicate, glassware, and electronic items during handling and transit."
    }
  ];

  return {
    "@type": "FAQPage",
    name: "KSR Shipping Services - Frequently Asked Questions",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

export function buildSiteNavigationSchema() {
  const navItems = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Why Choose Us", path: "/why-choose-us" },
    { name: "Services", path: "/services" },
    { name: "International Courier", path: "/services/international-courier" },
    { name: "Domestic Courier", path: "/services/domestic-courier" },
    { name: "Food Shipping", path: "/services/food-shipping" },
    { name: "Medicine Shipping", path: "/services/medicine-shipping" },
    { name: "Track Shipment", path: "/track" },
    { name: "Contact Us", path: "/contact" },
  ];

  return navItems.map((item) => ({
    "@type": "SiteNavigationElement",
    name: item.name,
    url: absoluteUrl(item.path),
  }));
}

export function buildIndividualServiceSchema({
  title,
  description,
  path,
  image,
  serviceType,
  areaServed = ["Hyderabad", "Telangana", "India", "USA", "UK", "Canada", "Australia", "UAE"],
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  serviceType?: string;
  areaServed?: string[];
}) {
  const url = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: title,
    description,
    url,
    serviceType: serviceType || title,
    provider: { "@id": `${SITE_URL}/#localbusiness` },
    areaServed: areaServed.map((name) => ({
      "@type": name === "Hyderabad" ? "City" : "Country",
      name,
    })),
    ...(image ? { image: absoluteUrl(image) } : {}),
  };
}

export function buildGlobalSchemaGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationSchema(),
      buildLocalBusinessSchema(),
      buildWebSiteSchema(),
      buildServiceCatalogSchema(),
      buildWhyChooseUsItemListSchema(),
      buildHomeFaqSchema(),
      ...buildSiteNavigationSchema(),
    ],
  };
}
