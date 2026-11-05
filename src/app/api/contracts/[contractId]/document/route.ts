import { isUuid } from "@/server/complianceProxy";
import { forwardToContracts } from "@/server/contractsProxy";
import { envelopeError } from "@/server/identityProxy";

// BFF: GET /api/contracts/{contractId}/document
//   → contracts-api GET /order-contracts/{contractId}/document
// PDF imutável do contrato (ETag = SHA-256). 409 quando o pedido foi
// cancelado antes de o contrato existir.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ contractId: string }> },
) {
  const { contractId } = await params;
  if (!isUuid(contractId)) {
    return envelopeError(
      422,
      "validation_error",
      "contractId deve ser um UUID.",
    );
  }

  return forwardToContracts({
    path: `/order-contracts/${encodeURIComponent(contractId)}/document`,
    binary: true,
  });
}
