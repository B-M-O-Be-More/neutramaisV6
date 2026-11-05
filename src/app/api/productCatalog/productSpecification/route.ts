import { NextRequest } from "next/server";

import { readJsonBody } from "@/server/complianceProxy";
import { forwardToMarketplace, pickBody } from "@/server/marketplaceProxy";

// Campos de `POST /productSpecification`. A organização vem do token, não do
// corpo; `characteristics` segue o template da categoria.
const CREATE_FIELDS = [
  "name",
  "categoryId",
  "characteristics",
  "description",
  "estimatedInstallationDays",
  "capacity",
] as const;

// BFF: GET /api/productCatalog/productSpecification
//   → marketplace-api GET /productCatalog/productSpecification
// Rota autenticada: especificações de produto da organização do usuário
// logado, sem paginação. Usada nas páginas do seller: vai com o token do
// perfil Seller (POST /auth/context).
export async function GET() {
  return forwardToMarketplace({
    method: "GET",
    path: "/productCatalog/productSpecification",
    authenticated: true,
    profileSession: true,
  });
}

// BFF: POST /api/productCatalog/productSpecification
//   → marketplace-api POST /productCatalog/productSpecification
// Cria a especificação na categoria (422 `MKT_TEMPLATE_FIELD_*` fora do
// template). Vai com o token do perfil Seller.
export async function POST(request: NextRequest) {
  return forwardToMarketplace({
    method: "POST",
    path: "/productCatalog/productSpecification",
    body: pickBody(await readJsonBody(request), CREATE_FIELDS),
    authenticated: true,
    profileSession: true,
  });
}
