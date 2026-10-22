import { NextRequest, NextResponse } from "next/server";

import { readJsonBody } from "@/server/complianceProxy";
import { callIdentity, envelopeError } from "@/server/identityProxy";

// BFF: POST /api/auth/mfa/enrollment/start
//   → identity-api POST /auth/mfa/enrollment/start (onboarding, NEU-563)
//
// O browser manda o `mfa_enrollment_token` do aceite no corpo; aqui ele vira o
// Bearer da chamada, que sai sem corpo. Não confundir com o /auth/mfa/enroll do
// primeiro login, que leva a credencial no corpo e devolve uma credencial nova.
export async function POST(request: NextRequest) {
  const body = (await readJsonBody(request)) as
    | { enrollment_token?: unknown }
    | undefined;
  const token = body?.enrollment_token;

  if (typeof token !== "string" || !token) {
    return envelopeError(
      401,
      "MFA_ENROLLMENT_TOKEN_INVALID",
      "Restart MFA enrollment.",
    );
  }

  const result = await callIdentity({
    method: "POST",
    path: "/auth/mfa/enrollment/start",
    authToken: token,
  });

  if (result.infraError) {
    return envelopeError(
      result.infraError.status,
      result.infraError.code,
      result.infraError.detail,
    );
  }

  // Segredos do autenticador: devolvidos uma vez e nunca guardados em cache.
  return new NextResponse(result.text, {
    status: result.status,
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "no-store",
    },
  });
}
