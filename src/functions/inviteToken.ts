// O Identity gera o token com `secrets.token_urlsafe`: só letras, dígitos,
// `-` e `_`.
const TOKEN = /^[A-Za-z0-9_-]+$/;

/** O valor tem o formato de um token de convite. */
export function isInviteToken(value: string): boolean {
  return TOKEN.test(value);
}

/**
 * Token do convite no fragmento do link (`/accept/#token=<token>`).
 *
 * Qualquer sufixo depois do token (ex.: `/change-password`, que chegou a vir em
 * e-mails antigos) e os demais parâmetros do fragmento são descartados.
 * Devolve null quando não há token válido.
 */
export function readInviteToken(hash: string): string | null {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  const match = /(?:^|&)token=([^&/]*)/.exec(fragment);
  const token = match?.[1] ?? "";
  return isInviteToken(token) ? token : null;
}
