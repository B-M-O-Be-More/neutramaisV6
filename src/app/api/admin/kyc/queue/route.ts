import { NextRequest } from "next/server";

import { forwardToIdentity } from "@/server/identityProxy";

// Filtros aceitos pelo upstream. Só estes são repassados — qualquer outro
// parâmetro da URL é descartado no BFF.
const ALLOWED_PARAMS = [
  "search",
  "status",
  "type",
  "date_from",
  "date_to",
  "limit",
  "offset",
] as const;

// BFF: GET /api/admin/kyc/queue → identity-api GET /admin/kyc/queue
// Fila de KYC com filtros, indicadores e SLA. Rota autenticada: exige
// `kyc:approve` com MFA — o Bearer sai do cookie httpOnly.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = new URLSearchParams();
  for (const key of ALLOWED_PARAMS) {
    const value = searchParams.get(key);
    if (value) query.set(key, value);
  }
  const qs = query.toString();

  return forwardToIdentity({
    method: "GET",
    path: `/admin/kyc/queue${qs ? `?${qs}` : ""}`,
  });
}
