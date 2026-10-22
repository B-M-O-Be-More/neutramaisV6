import { NextRequest } from "next/server";

import { isUuid, readJsonBody } from "@/server/complianceProxy";
import { envelopeError, forwardToIdentity } from "@/server/identityProxy";

// BFF: POST /api/admin/sanctions/run → identity-api POST /admin/sanctions/run
// Checagem de sanções de UMA organização, síncrona. O upstream recusa campos
// extras, então só o `organization_id` é repassado. Exige `sanctions:run`.
export async function POST(request: NextRequest) {
  const body = (await readJsonBody(request)) as
    | { organization_id?: unknown }
    | undefined;
  const organizationId = body?.organization_id;

  if (typeof organizationId !== "string" || !isUuid(organizationId)) {
    return envelopeError(
      422,
      "validation_error",
      "organization_id deve ser um UUID.",
    );
  }

  return forwardToIdentity({
    method: "POST",
    path: "/admin/sanctions/run",
    body: { organization_id: organizationId },
  });
}
