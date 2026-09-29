import { NextRequest } from "next/server";

import { forwardToIdentity } from "@/server/identityProxy";

// BFF: POST /api/auth/password-reset/request
//   → identity-api POST /auth/password-reset/request
// Rota pública. O upstream sempre responde 200 com a mesma mensagem, exista ou
// não a conta (evita enumeração de e-mails cadastrados); aqui só repassamos o
// envelope e o status verbatim.
export async function POST(request: NextRequest) {
  const body = await request.json();

  return forwardToIdentity({
    method: "POST",
    path: "/auth/password-reset/request",
    body,
  });
}
