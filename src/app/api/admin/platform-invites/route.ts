import { NextRequest } from "next/server";

import { forwardToIdentity } from "@/server/identityProxy";

// BFF: POST /api/admin/platform-invites
//   → identity-api POST /admin/platform-invites
//
// Convida um operador da plataforma por e-mail (`{ email, target_role }`).
// Rota autenticada: exige `super_admin` com MFA na sessão — o Bearer sai do
// cookie httpOnly.
export async function POST(request: NextRequest) {
  const body = await request.json();

  return forwardToIdentity({
    method: "POST",
    path: "/admin/platform-invites",
    body,
  });
}
