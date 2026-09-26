import { getDb } from "@/lib/db/client";
import { getCalculatorBySlug } from "@/lib/db/repositories/calculators";
import { jsonError, withErrorHandling } from "@/lib/http";

/** GET /api/calculators/:slug — a calculator with its input definitions. */
export const GET = withErrorHandling(async function get(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const calculator = await getCalculatorBySlug(await getDb(), slug);
  if (!calculator) return jsonError(404, `Unknown calculator "${slug}".`);
  return Response.json({ calculator });
});
