import { withErrorHandling } from "@/lib/http";
import { getDb } from "@/lib/db/client";
import { listCalculators } from "@/lib/db/repositories/calculators";

/** GET /api/calculators — every calculator and its status. */
export const GET = withErrorHandling(async function get() {
  const calculators = await listCalculators(await getDb());
  return Response.json({ calculators });
});
