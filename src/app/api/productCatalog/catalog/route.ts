import { forwardToMarketplace } from "@/server/marketplaceProxy";

// BFF: GET /api/productCatalog/catalog → marketplace-api GET /productCatalog/catalog
// Rota autenticada: catálogo da organização. O upstream cria um
// ("Default Catalog") na primeira leitura — criar especificação exige que ele
// exista. Vai com o token do perfil Seller (POST /auth/context).
export async function GET() {
  return forwardToMarketplace({
    method: "GET",
    path: "/productCatalog/catalog",
    authenticated: true,
    profileSession: true,
  });
}
