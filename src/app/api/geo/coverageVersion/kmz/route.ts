import { NextRequest, NextResponse } from "next/server";

import { forwardToGeo } from "@/server/geoProxy";
import { readKmzForm } from "@/server/kmzForm";

// BFF: POST /api/geo/coverageVersion/kmz → geo-api POST /geo/coverageVersion/kmz
// Envia um KMZ e cria uma versão de cobertura imutável (o mesmo arquivo de
// novo devolve a versão existente). Multipart com `organization_id`, `file`
// (.kmz, até 50 MB) e `predecessor_id` opcional. Exige o papel
// `org_owner` ou `seller_owner` da própria organização. 409 quando a cota de
// armazenamento acabou; 429 enquanto outro KMZ é importado.

export async function POST(request: NextRequest) {
  // Só os campos do contrato seguem para o upstream.
  const body = await readKmzForm(request);
  if (body instanceof NextResponse) return body;

  return forwardToGeo({
    method: "POST",
    path: "/geo/coverageVersion/kmz",
    body,
    long: true,
  });
}
