import { isUuid } from "@/server/complianceProxy";
import { forwardToContracts } from "@/server/contractsProxy";
import { envelopeError } from "@/server/identityProxy";

// BFF: GET /api/contracts/{contractId}
//   → contracts-api GET /order-contracts/{contractId}
// Estado, hash do documento e signatário. Nunca traz o link de assinatura.
// 403 de outra organização; 404 inexistente.
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
    path: `/order-contracts/${encodeURIComponent(contractId)}`,
  });
}
