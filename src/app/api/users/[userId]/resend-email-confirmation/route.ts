import { NextRequest } from "next/server";

import { forwardToIdentity } from "@/server/identityProxy";

// BFF: POST /api/users/{userId}/resend-email-confirmation
//   → identity-api POST /users/{user_id}/resend-email-confirmation
// Reenvia o e-mail de confirmação (link com token + user_id).
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  return forwardToIdentity({
    method: "POST",
    path: `/users/${userId}/resend-email-confirmation`,
  });
}
