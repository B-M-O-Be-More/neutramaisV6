import { NextRequest } from "next/server";

import { envelopeError } from "@/server/identityProxy";
import { forwardToMarketplace } from "@/server/marketplaceProxy";
import {
  OFFERING_ACTIONS,
  type OfferingAction,
} from "@/services/productCatalog.service";

function isOfferingAction(action: string): action is OfferingAction {
  return (OFFERING_ACTIONS as readonly string[]).includes(action);
}

// BFF: POST /api/productCatalog/productOffering/{offeringId}/{action}
//   → marketplace-api POST /productCatalog/productOffering/{id}/{action}
// Rota autenticada: transição do ciclo de vida (publish, pause, unpublish,
// archive), sem body. Só essas ações são repassadas; o upstream valida
// permissão, dono da oferta e o status atual.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ offeringId: string; action: string }> },
) {
  const { offeringId, action } = await params;

  if (!isOfferingAction(action)) {
    return envelopeError(
      404,
      "OFFERING_ACTION_NOT_FOUND",
      "Ação desconhecida.",
    );
  }

  return forwardToMarketplace({
    method: "POST",
    path: `/productCatalog/productOffering/${encodeURIComponent(offeringId)}/${action}`,
    authenticated: true,
  });
}
