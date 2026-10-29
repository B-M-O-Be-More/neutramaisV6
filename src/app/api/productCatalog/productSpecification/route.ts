import { NextRequest } from "next/server";

import { readJsonBody } from "@/server/complianceProxy";
import { forwardToMarketplace, pickBody } from "@/server/marketplaceProxy";

// Campos de `POST /productSpecification`. O catálogo vem da organização do
// token, não do corpo.
const CREATE_FIELDS = [
  "name",
  "description",
  "estimatedInstallationDays",
  "capacity",
] as const;

// BFF: GET /api/productCatalog/productSpecification
//   → marketplace-api GET /productCatalog/productSpecification
// Rota autenticada: especificações de produto da organização do usuário
// logado, sem paginação.
export async function GET() {
  return forwardToMarketplace({
    method: "GET",
    path: "/productCatalog/productSpecification",
    authenticated: true,
  });
}

// BFF: POST /api/productCatalog/productSpecification
//   → marketplace-api POST /productCatalog/productSpecification
// Cria um plano no catálogo da organização (404 se o catálogo não existir —
// leia `GET /catalog` antes).
export async function POST(request: NextRequest) {
  return forwardToMarketplace({
    method: "POST",
    path: "/productCatalog/productSpecification",
    body: pickBody(await readJsonBody(request), CREATE_FIELDS),
    authenticated: true,
  });
}
