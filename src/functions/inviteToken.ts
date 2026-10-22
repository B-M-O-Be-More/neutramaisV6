// O Identity gera o token com `secrets.token_urlsafe`: só letras, dígitos,
// `-` e `_`.
const TOKEN = /^[A-Za-z0-9_-]+$/;

/**
 * Token do convite de operador no fragmento do link (`#token=<token>`).
 *
 * O e-mail chega como `FRONTEND_URL#token=<token>/change-password`: o sufixo
 * depois do token não faz parte dele e é descartado, assim como qualquer outro
 * parâmetro do fragmento. Devolve null quando não há token válido.
 */
export function readInviteToken(hash: string): string | null {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  const match = /(?:^|&)token=([^&/]*)/.exec(fragment);
  const token = match?.[1] ?? "";
  return TOKEN.test(token) ? token : null;
}
