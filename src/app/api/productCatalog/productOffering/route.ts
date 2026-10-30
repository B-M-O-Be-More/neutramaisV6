import { NextRequest } from "next/server";

import { readJsonBody } from "@/server/complianceProxy";
import { forwardToMarketplace, pickBody } from "@/server/marketplaceProxy";

// Paginação e filtros aceitos pelo upstream. Só estes são repassados —
// qualquer outro parâmetro da URL é descartado no BFF. A validação (inteiros
// ≥ 0, status conhecido) fica com a marketplace-api, que responde 422 quando
// inválidos.
const ALLOWED_PARAMS = [
  "offset",
  "limit",
  "status",
  "name",
  "specificationId",
] as const;

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

// Campos de `POST /productOffering`. `isPublic` fica de fora: a oferta nasce
// sempre `draft` e é publicada pela transição `publish`.
const CREATE_FIELDS = [
  "name",
  "specificationId",
  "monthlyPrice",
  "installationPrice",
  "speed",
  "durationMonths",
  "isCorporate",
  "stateCode",
  "isCapital",
  "metadata",
  // Hardware / CPE: produto físico com o pacote de envio.
  "productType",
  "shipping",
] as const;

// BFF: POST /api/productCatalog/productOffering
//   → marketplace-api POST /productCatalog/productOffering
// Cria a oferta como rascunho. 403 `MKT_SELLER_NOT_APPROVED` com a
// organização não ativa.
export async function POST(request: NextRequest) {
  return forwardToMarketplace({
    method: "POST",
    path: "/productCatalog/productOffering",
    body: pickBody(await readJsonBody(request), CREATE_FIELDS),
    authenticated: true,
  });
}
