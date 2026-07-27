export { absoluteUrl, LOCALE, PUBLIC_ROUTES, SITE_NAME, SITE_URL, SITEMAP_IMAGES, THEME_COLOR } from "./site";
export { createPageMetadata, rootMetadata } from "./metadata";
export type { PageSeoConfig } from "./metadata";
export { pageSeo } from "./pages";
export {
  buildBreadcrumbSchema,
  buildFaqPageSchema,
  buildGlobalSchemaGraph,
  buildLocalBusinessSchema,
  buildOrganizationSchema,
  buildServiceCatalogSchema,
  buildWebPageSchema,
  buildWebSiteSchema,
} from "./schema";
