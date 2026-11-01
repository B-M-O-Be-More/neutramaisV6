import { forwardToMarketplace } from "@/server/marketplaceProxy";

// BFF: GET /api/productCatalog/productOffering/summary
//   → marketplace-api GET /productCatalog/productOffering/summary
// Rota autenticada: contadores do catálogo da organização do usuário logado
// (total, por status, cobertura, patrocinadas e faixa de preço).
export async function GET() {
  return forwardToMarketplace({
    method: "GET",
    path: "/productCatalog/productOffering/summary",
    authenticated: true,
  });
}
