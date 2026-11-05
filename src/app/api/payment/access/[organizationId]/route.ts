import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToPayment } from "@/server/paymentProxy";

// BFF: GET /api/payment/access/{organizationId}
//   → payment-api GET /payment/access/{organization_id}
// Situação da conta Stripe Connect da organização (hasAccount, isOnboarded,
// chargesEnabled, payoutsEnabled). Sem conta também é 200, com tudo false.
// Só a própria organização lê (403 `organization_access_denied`).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  if (!isUuid(organizationId)) {
    return envelopeError(
      422,
      "validation_error",
      "organizationId deve ser um UUID.",
    );
  }

  return forwardToPayment({ path: `/payment/access/${organizationId}` });
}
