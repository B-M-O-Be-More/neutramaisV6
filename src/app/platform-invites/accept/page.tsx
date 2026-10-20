import { Suspense } from "react";

import AcceptPlatformInvite from "@/components/AcceptPlatformInvite";
import AuthLayout from "@/components/AuthLayout";

// Página pública aberta pelo link do convite de operador (`?token=...`).
// useSearchParams exige um limite de Suspense no App Router.
export default function AcceptPlatformInvitePage() {
  return (
    <AuthLayout>
      <Suspense>
        <AcceptPlatformInvite />
      </Suspense>
    </AuthLayout>
  );
}
