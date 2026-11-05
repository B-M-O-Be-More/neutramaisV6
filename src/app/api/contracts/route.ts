import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { forwardToContracts } from "@/server/contractsProxy";
import { envelopeError } from "@/server/identityProxy";

// O upstream aceita page ≥ 1 e size de 1 a 100.
const PAGE_PATTERN = /^[1-9]\d{0,5}$/;
const SIZE_PATTERN = /^(100|[1-9]\d?)$/;

// BFF: GET /api/contracts?orderId=&page=1&size=20
//   → contracts-api GET /order-contracts
// Contratos de pedido em que a organização do perfil é Buyer ou Seller,
// ordenados pelo contractId. Exige `contract:read`.
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const orderId = search.get("orderId");
  const page = search.get("page");
  const size = search.get("size");

  if (orderId !== null && !isUuid(orderId)) {
    return envelopeError(422, "validation_error", "orderId deve ser um UUID.");
  }
  if (
    (page !== null && !PAGE_PATTERN.test(page)) ||
    (size !== null && !SIZE_PATTERN.test(size))
  ) {
    return envelopeError(
      422,
      "validation_error",
      "Use page a partir de 1 e size de 1 a 100.",
    );
  }

  return forwardToContracts({
    path: "/order-contracts",
    params: { orderId, page, size },
  });
}
