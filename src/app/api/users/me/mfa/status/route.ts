import { forwardToIdentity } from "@/server/identityProxy";

// BFF: GET /api/users/me/mfa/status → identity-api GET /users/me/mfa/status
// 2FA do usuário da sessão: `enrolled` (autenticador confirmado),
// `enrolled_at` e `recovery_codes_remaining`.
export async function GET() {
  return forwardToIdentity({ method: "GET", path: "/users/me/mfa/status" });
}
