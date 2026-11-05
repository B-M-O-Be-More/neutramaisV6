import { isUuid } from "@/server/complianceProxy";
import { forwardToContracts } from "@/server/contractsProxy";
import { envelopeError } from "@/server/identityProxy";

// BFF: POST /api/contracts/{contractId}/sign
//   → contracts-api POST /order-contracts/{contractId}/sign
// Vincula o usuário do Buyer como signatário e devolve o link pessoal da
// Autentique. Sem corpo: o e-mail vem da Identity, nunca do browser. Exige
// `contract:sign`; repetir com o mesmo usuário devolve o mesmo link.
export async function POST(
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
    method: "POST",
    path: `/order-contracts/${encodeURIComponent(contractId)}/sign`,
  });
}
