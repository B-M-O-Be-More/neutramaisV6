import { NextRequest } from "next/server";

import { readJsonBody } from "@/server/complianceProxy";
import { callIdentity, envelopeError } from "@/server/identityProxy";
import { sessionResponse } from "@/server/sessionResponse";

// BFF: POST /api/auth/mfa/enrollment/confirm
//   → identity-api POST /auth/mfa/enrollment/confirm (onboarding, NEU-563)
//
// O `mfa_enrollment_token` vira o Bearer e só o `totp_code` segue no corpo.
// Em sucesso nasce a sessão: os tokens viram cookies httpOnly e saem do corpo.
// `rememberMe` é sinal só do front.
export async function POST(request: NextRequest) {
  const body = (await readJsonBody(request)) as
    | { enrollment_token?: unknown; totp_code?: unknown; rememberMe?: unknown }
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
    path: "/auth/mfa/enrollment/confirm",
    body: { totp_code: body?.totp_code },
    authToken: token,
  });

  return sessionResponse(result, Boolean(body?.rememberMe));
}
