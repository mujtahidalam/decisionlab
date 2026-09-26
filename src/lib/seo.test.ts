import { describe, expect, it } from "vitest";
import { getCalculator } from "./calculators/registry";
import { breadcrumbJsonLd, buildPageMetadata, calculatorJsonLd, faqJsonLd } from "./seo";
import { absoluteUrl } from "./site";

describe("seo helpers", () => {
  it("builds canonical URLs and social metadata", () => {
    const m = buildPageMetadata({ title: "T", description: "D", path: "/calculators/masters-roi" });
    expect(m.alternates?.canonical).toBe(absoluteUrl("/calculators/masters-roi"));
    expect(m.openGraph?.title).toBe("T");
    expect(m.title).toBe("T");
    expect(buildPageMetadata({ title: "T", description: "D", path: "/", absoluteTitle: true }).title).toEqual({ absolute: "T" });
  });

  it("builds schema.org JSON-LD", () => {
    const app = calculatorJsonLd(getCalculator("masters-roi"), "desc");
    expect(app["@type"]).toBe("WebApplication");
    expect(app.url).toBe(absoluteUrl("/calculators/masters-roi"));

    const faq = faqJsonLd([{ question: "Q?", answer: "A." }]);
    expect(faq).toMatchObject({ "@type": "FAQPage", mainEntity: [{ name: "Q?", acceptedAnswer: { text: "A." } }] });

    const crumbs = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "X", path: "/x" }]);
    expect(crumbs).toMatchObject({ itemListElement: [{ position: 1 }, { position: 2, item: absoluteUrl("/x") }] });
  });

  it("throws for unknown calculators", () => {
    expect(() => getCalculator("nope")).toThrow();
  });
});
