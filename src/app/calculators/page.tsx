import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { calculators } from "@/lib/calculators/registry";
import { breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Financial & Career Decision Calculators",
  description:
    "Free, transparent calculators for major financial and career decisions — starting with a master's degree ROI calculator with scenarios and sensitivity analysis.",
  path: "/calculators",
});

export default function CalculatorsPage() {
  return (
    <Container className="py-14">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Calculators", path: "/calculators" },
        ])}
      />
      <h1 className="text-4xl font-semibold tracking-tight">Calculators</h1>
      <p className="mt-3 max-w-2xl text-ink-2">
        Each calculator uses a published, deterministic model with scenario and sensitivity analysis built in.
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {calculators.map((c) => (
          <li key={c.slug} className="flex">
            {c.status === "live" ? (
              <Link href={c.path} className="flex w-full flex-col rounded-2xl border border-line bg-surface p-6 hover:border-accent hover:shadow-sm">
                <div className="flex items-center gap-2">
                  <Badge tone="positive">Live</Badge>
                  <Badge>{c.category}</Badge>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-ink">{c.name}</h2>
                <p className="mt-2 flex-1 text-sm text-ink-2">{c.description}</p>
                <span className="mt-4 text-sm font-medium text-accent">Open calculator →</span>
              </Link>
            ) : (
              <div className="flex w-full flex-col rounded-2xl border border-dashed border-line-strong p-6">
                <div className="flex items-center gap-2">
                  <Badge>Coming soon</Badge>
                  <Badge>{c.category}</Badge>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-ink-2">{c.name}</h2>
                <p className="mt-2 text-sm text-ink-3">{c.description}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Container>
  );
}
