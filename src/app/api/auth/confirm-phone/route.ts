import { NextRequest } from "next/server";

import { forwardToIdentity } from "@/server/identityProxy";

// BFF: POST /api/auth/confirm-phone → identity-api POST /auth/confirm-phone
// Rota pública. Valida o OTP enviado por SMS pelo resend-phone-otp; o usuário
// vai no corpo (`user_id`), já que aqui ainda não existe sessão.
export async function POST(request: NextRequest) {
  const body = await request.json();

  return forwardToIdentity({
    method: "POST",
    path: "/auth/confirm-phone",
    body,
  });
}
