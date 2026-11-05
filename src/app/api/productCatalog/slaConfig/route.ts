import { NextRequest } from "next/server";

import { readJsonBody } from "@/server/complianceProxy";
import { forwardToMarketplace, pickBody } from "@/server/marketplaceProxy";

// Campos de `PATCH /slaConfig`; `null` mantém o valor atual.
const UPDATE_FIELDS = ["maxFirstResponseHours", "maxResolutionHours"] as const;

// BFF: GET /api/productCatalog/slaConfig
//   → marketplace-api GET /productCatalog/slaConfig
// Prazos de SLA da organização do token (primeira resposta e resolução, em
// horas). Sem configuração, a API cria a padrão (4 h e 48 h). Vai com o
// token do perfil Seller.
export async function GET() {
  return forwardToMarketplace({
    method: "GET",
    path: "/productCatalog/slaConfig",
    authenticated: true,
    profileSession: true,
  });
}

// BFF: PATCH /api/productCatalog/slaConfig
//   → marketplace-api PATCH /productCatalog/slaConfig
// Altera os prazos (inteiros ≥ 1; resolução ≥ primeira resposta, senão 400).
// Exige `sla:change` (403 `MKT_PERMISSION_REQUIRED`).
export async function PATCH(request: NextRequest) {
  return forwardToMarketplace({
    method: "PATCH",
    path: "/productCatalog/slaConfig",
    body: pickBody(await readJsonBody(request), UPDATE_FIELDS),
    authenticated: true,
    profileSession: true,
  });
}
