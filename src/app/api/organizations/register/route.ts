import { NextRequest } from "next/server";

import { forwardToIdentity } from "@/server/identityProxy";

// BFF: POST /api/organizations/register → identity-api POST /organizations/register
// Rota pública (sem auth). Encaminha o payload e devolve o envelope upstream.
export async function POST(request: NextRequest) {
  const body = await request.json();
  return forwardToIdentity({
    method: "POST",
    path: "/organizations/register",
    body,
  });
}
