/**
 * Site-wide configuration. The public URL comes from NEXT_PUBLIC_SITE_URL so
 * canonical links, Open Graph URLs and the sitemap are correct per deployment.
 */
export const siteConfig = {
  name: "DecisionLens",
  tagline: "Clear math for life's biggest decisions",
  description:
    "DecisionLens helps you evaluate major financial and career decisions with transparent mathematical models, scenario analysis and sensitivity analysis — no black boxes.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://decisionlens.example.com").replace(/\/+$/, ""),
  locale: "en_US",
} as const;

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = "/"): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
