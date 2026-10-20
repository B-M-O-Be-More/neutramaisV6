import { NextRequest } from "next/server";

import { resolveFlowAuthToken } from "@/server/authCookies";
import { forwardToIdentity } from "@/server/identityProxy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  return forwardToIdentity({
    method: "POST",
    path: `/organizations/${orgId}/kyc/uploads`,
    body: await request.json(),
    authToken: await resolveFlowAuthToken(),
  });
}
