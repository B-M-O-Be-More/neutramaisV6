import { Suspense } from "react";

import AcceptPlatformInvite from "@/components/AcceptPlatformInvite";
import AuthLayout from "@/components/AuthLayout";

// Página pública do convite de operador. O token vem no fragmento
// (`#token=...`); o link do e-mail aponta para a home, que redireciona para cá
// (InviteLinkRedirect). useSearchParams exige um limite de Suspense no App
// Router.
export default function AcceptPlatformInvitePage() {
  return (
    <AuthLayout>
      <Suspense>
        <AcceptPlatformInvite />
      </Suspense>
    </AuthLayout>
  );
}
