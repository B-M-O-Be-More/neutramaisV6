import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { forwardToGeo } from "@/server/geoProxy";
import { envelopeError } from "@/server/identityProxy";

// BFF: POST /api/geo/coverageVersion/kmz → geo-api POST /geo/coverageVersion/kmz
// Envia um KMZ e cria uma versão de cobertura imutável (o mesmo arquivo de
// novo devolve a versão existente). Multipart com `organization_id`, `file`
// (.kmz, até 50 MB) e `predecessor_id` opcional. Exige o papel
// `org_owner` ou `seller_owner` da própria organização. 409 quando a cota de
// armazenamento acabou; 429 enquanto outro KMZ é importado.

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const organizationId = form.get("organization_id");
  const file = form.get("file");
  const predecessorId = form.get("predecessor_id");

  if (typeof organizationId !== "string" || !isUuid(organizationId)) {
    return envelopeError(
      422,
      "validation_error",
      "organization_id deve ser um UUID.",
    );
  }
  if (!(file instanceof File)) {
    return envelopeError(422, "validation_error", "Arquivo KMZ obrigatório.");
  }

  // Só os campos do contrato seguem para o upstream.
  const body = new FormData();
  body.append("organization_id", organizationId);
  body.append("file", file, file.name);
  if (typeof predecessorId === "string" && isUuid(predecessorId)) {
    body.append("predecessor_id", predecessorId);
  }

  return forwardToGeo({
    method: "POST",
    path: "/geo/coverageVersion/kmz",
    body,
    long: true,
  });
}
