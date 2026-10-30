import { NextRequest } from "next/server";

import { envelopeError } from "@/server/identityProxy";
import { forwardToWallet, isWalletCurrency } from "@/server/walletProxy";

// BFF: GET /api/wallet/balance?currency=BRL
//   → wallet-api GET /wallet/balance
// Saldo da organização do token, em unidades mínimas (centavos): disponível e
// reservado em checkouts em andamento. Exige `wallet:read` (403 sem ela).
export async function GET(request: NextRequest) {
  const currency = request.nextUrl.searchParams.get("currency") ?? "BRL";

  if (!isWalletCurrency(currency)) {
    return envelopeError(
      422,
      "validation_error",
      "currency deve ser BRL, USD ou EUR.",
    );
  }

  return forwardToWallet({ path: "/wallet/balance", params: { currency } });
}
