import type { MetadataRoute } from "next";
import { liveCalculators } from "@/lib/calculators/registry";
import { absoluteUrl } from "@/lib/site";

/** Generated from the calculator registry, so new calculators are indexed automatically. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/calculators"), changeFrequency: "monthly", priority: 0.8 },
    ...liveCalculators().map((c) => ({
      url: absoluteUrl(c.path),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
