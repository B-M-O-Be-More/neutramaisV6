import "server-only";

import { envelopeError } from "./identityProxy";

// Contrato da orders-api e da payment-api: 1 a 128 caracteres de A-Z, a-z,
// 0-9, ".", "_", ":" e "-".
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";

/**
 * Lê o `Idempotency-Key` do browser para repassar ao upstream. Devolve o
 * header pronto ou a resposta 422 quando ele falta ou foge do formato: o
 * BFF recusa antes de chamar a API, como ela faria.
 */
export function readIdempotencyKey(
  request: Request,
): { headers: Record<string, string> } | { error: Response } {
  const key = request.headers.get(IDEMPOTENCY_KEY_HEADER);
  if (!key || !IDEMPOTENCY_KEY_PATTERN.test(key)) {
    return {
      error: envelopeError(
        422,
        "validation_error",
        "Envie o header Idempotency-Key (1 a 128 caracteres: letras, números, ., _, : e -).",
      ),
    };
  }
  return { headers: { [IDEMPOTENCY_KEY_HEADER]: key } };
}
