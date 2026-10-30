import { forwardToMarketplace } from "@/server/marketplaceProxy";

// BFF: GET /api/productCatalog/catalog → marketplace-api GET /productCatalog/catalog
// Rota autenticada: catálogo da organização. O upstream cria um
// ("Default Catalog") na primeira leitura — criar especificação exige que ele
// exista.
export async function GET() {
  return forwardToMarketplace({
    method: "GET",
    path: "/productCatalog/catalog",
    authenticated: true,
  });
}
