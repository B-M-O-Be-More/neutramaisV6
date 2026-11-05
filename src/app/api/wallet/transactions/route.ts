import { NextRequest } from "next/server";

import { envelopeError } from "@/server/identityProxy";
import { forwardToWallet, isWalletCurrency } from "@/server/walletProxy";

// O upstream aceita de 1 a 100 itens; o cursor é a sequência do ledger.
const LIMIT_PATTERN = /^(100|[1-9]\d?)$/;
const CURSOR_PATTERN = /^\d{1,19}$/;

// BFF: GET /api/wallet/transactions?currency=BRL&limit=25&cursor=123
//   → wallet-api GET /wallet/transactions
// Extrato da organização do token, do lançamento mais novo ao mais antigo.
// `nextCursor` na resposta continua a página (exclusivo).
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const currency = search.get("currency") ?? "BRL";
  const limit = search.get("limit");
  const cursor = search.get("cursor");

  if (
    !isWalletCurrency(currency) ||
    (limit !== null && !LIMIT_PATTERN.test(limit)) ||
    (cursor !== null && !CURSOR_PATTERN.test(cursor))
  ) {
    return envelopeError(
      422,
      "validation_error",
      "Use currency BRL, USD ou EUR, limit de 1 a 100 e cursor numérico.",
    );
  }

  return forwardToWallet({
    path: "/wallet/transactions",
    params: { currency, limit, cursor },
  });
}
