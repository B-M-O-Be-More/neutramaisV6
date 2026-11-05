import { NextRequest } from "next/server";

import { forwardToMarketplace } from "@/server/marketplaceProxy";

// BFF: GET /api/productCatalog/category → marketplace-api GET /productCatalog/category
// Árvore de categorias da plataforma (sem o template — ele vem em
// `GET /category/{id}`). Qualquer papel com token lê; `includeInactive` é só
// do super_admin, então não é repassado. Vai com o token do perfil, com o do
// login como reserva.
export async function GET(request: NextRequest) {
  const tree = request.nextUrl.searchParams.get("tree");
  return forwardToMarketplace({
    method: "GET",
    path: "/productCatalog/category",
    params: { tree: tree === "false" ? "false" : "true" },
    authenticated: true,
    profileSession: true,
  });
}
