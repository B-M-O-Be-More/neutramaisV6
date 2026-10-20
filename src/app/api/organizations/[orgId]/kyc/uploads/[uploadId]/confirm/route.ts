import { NextRequest } from "next/server";

import { resolveFlowAuthToken } from "@/server/authCookies";
import { forwardToIdentity } from "@/server/identityProxy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; uploadId: string }> },
) {
  const { orgId, uploadId } = await params;
  return forwardToIdentity({
    method: "POST",
    path: `/organizations/${orgId}/kyc/uploads/${uploadId}/confirm`,
    body: await request.json(),
    authToken: await resolveFlowAuthToken(),
  });
}
