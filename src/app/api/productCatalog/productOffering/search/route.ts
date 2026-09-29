import { NextRequest } from "next/server";

import { forwardToMarketplace } from "@/server/marketplaceProxy";

// Filtros aceitos pelo upstream. Só estes são repassados — qualquer outro
// parâmetro da URL é descartado no BFF.
const ALLOWED_PARAMS = [
  "stateCode",
  "specificationName",
  "isCorporate",
  "maxPrice",
  "page",
  "pageSize",
] as const;

// BFF: GET /api/productCatalog/productOffering/search
//   → marketplace-api GET /productCatalog/productOffering/search
// Rota pública (sem auth): lista ofertas públicas e ativas de todas as
// organizações, ordenadas por preço mensal crescente.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params = Object.fromEntries(
    ALLOWED_PARAMS.map((key) => [key, searchParams.get(key)]),
  );

  return forwardToMarketplace({
    method: "GET",
    path: "/productCatalog/productOffering/search",
    params,
  });
}
