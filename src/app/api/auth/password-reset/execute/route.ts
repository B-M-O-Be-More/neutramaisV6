import { NextRequest } from "next/server";

import { forwardToIdentity } from "@/server/identityProxy";

// BFF: POST /api/auth/password-reset/execute
//   → identity-api POST /auth/password-reset/execute
//
// Efetiva a nova senha. Aqui o `token` recebido por e-mail É a credencial (não
// há sessão), e a política mínima é de 12 caracteres (RN-528) — validada no
// front pelo schema e no upstream de novo.
//
// `authToken: ""` evita anexar o Bearer de uma sessão eventualmente aberta no
// mesmo browser: quem autoriza a troca é o token do e-mail, não a sessão.
export async function POST(request: NextRequest) {
  const body = await request.json();

  return forwardToIdentity({
    method: "POST",
    path: "/auth/password-reset/execute",
    body,
    authToken: "",
  });
}
