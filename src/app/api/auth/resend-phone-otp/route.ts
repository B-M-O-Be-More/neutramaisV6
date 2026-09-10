import { NextRequest } from "next/server";

import { forwardToIdentity } from "@/server/identityProxy";

// BFF: POST /api/auth/resend-phone-otp → identity-api POST /auth/resend-phone-otp
// Rota pública: dispara o SMS com o OTP do telefone do usuário. É chamada na
// etapa de Verificação do cadastro, quando ainda não há sessão — o usuário é
// identificado pelo `user_id` do corpo (o mesmo que veio no link do e-mail).
export async function POST(request: NextRequest) {
  const body = await request.json();

  return forwardToIdentity({
    method: "POST",
    path: "/auth/resend-phone-otp",
    body,
  });
}
