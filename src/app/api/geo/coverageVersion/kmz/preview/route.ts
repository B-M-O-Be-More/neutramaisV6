import { NextRequest, NextResponse } from "next/server";

import { forwardToGeo } from "@/server/geoProxy";
import { readKmzForm } from "@/server/kmzForm";

// BFF: POST /api/geo/coverageVersion/kmz/preview
//   → geo-api POST /geo/coverageVersion/kmz/preview
// Lê o KMZ e calcula quanto a importação vai consumir da cota, sem gravar
// nada. Mesmo multipart do envio. 200 também quando não cabe
// (`canUpload: false`); 422 com `detail` para KMZ inválido; 429 enquanto
// outra importação ou prévia roda.

export async function POST(request: NextRequest) {
  const body = await readKmzForm(request);
  if (body instanceof NextResponse) return body;

  return forwardToGeo({
    method: "POST",
    path: "/geo/coverageVersion/kmz/preview",
    body,
    long: true,
  });
}
