import { NextRequest } from "next/server";

import { forwardToMarketplace } from "@/server/marketplaceProxy";

// Paginação aceita pelo upstream. Só estes são repassados — qualquer outro
// parâmetro da URL é descartado no BFF. A validação (inteiros ≥ 0) fica com a
// marketplace-api, que responde 422 quando inválidos.
const ALLOWED_PARAMS = ["offset", "limit"] as const;

// BFF: GET /api/productCatalog/productOffering
//   → marketplace-api GET /productCatalog/productOffering
// Rota autenticada: lista as ofertas da organização do usuário logado. O
// Bearer sai do cookie httpOnly (access_token); sem sessão o upstream devolve
// 403.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params = Object.fromEntries(
    ALLOWED_PARAMS.map((key) => [key, searchParams.get(key)]),
  );

  return forwardToMarketplace({
    method: "GET",
    path: "/productCatalog/productOffering",
    params,
    authenticated: true,
  });
}
