import { NextRequest } from "next/server";

import { forwardToIdentity } from "@/server/identityProxy";

// BFF: POST /api/platform-invites/accept
//   → identity-api POST /platform-invites/accept
//
// Cria a conta do operador convidado (`{ token, display_name, phone,
// password }`). Pública: o `token` do e-mail é a credencial.
//
// `authToken: ""` evita anexar o Bearer de uma sessão eventualmente aberta no
// mesmo browser — quem autoriza aqui é o token do convite.
export async function POST(request: NextRequest) {
  const body = await request.json();

  return forwardToIdentity({
    method: "POST",
    path: "/platform-invites/accept",
    body,
    authToken: "",
  });
}
