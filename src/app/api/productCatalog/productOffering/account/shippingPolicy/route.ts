import { NextRequest } from "next/server";

import { readJsonBody } from "@/server/complianceProxy";
import { forwardToMarketplace, pickBody } from "@/server/marketplaceProxy";

// Campos de `PUT /account/shippingPolicy` (extras viram 422 no upstream).
const UPDATE_FIELDS = ["autoAccept", "expectedVersion"] as const;

// BFF: GET /api/productCatalog/productOffering/account/shippingPolicy
//   → marketplace-api GET /productCatalog/productOffering/account/shippingPolicy
// Aceite automático da organização, para todos os produtos físicos
// (`autoAccept`, `version`). Exige `order:accept`. Responde só `{"data": …}`.
export async function GET() {
  return forwardToMarketplace({
    method: "GET",
    path: "/productCatalog/productOffering/account/shippingPolicy",
    authenticated: true,
    profileSession: true,
  });
}

// BFF: PUT /api/productCatalog/productOffering/account/shippingPolicy
//   → marketplace-api PUT /productCatalog/productOffering/account/shippingPolicy
// Liga ou desliga o aceite automático. `expectedVersion` é a versão lida:
// outra tela que gravou antes faz o upstream responder 409.
export async function PUT(request: NextRequest) {
  return forwardToMarketplace({
    method: "PUT",
    path: "/productCatalog/productOffering/account/shippingPolicy",
    body: pickBody(await readJsonBody(request), UPDATE_FIELDS),
    authenticated: true,
    profileSession: true,
  });
}
