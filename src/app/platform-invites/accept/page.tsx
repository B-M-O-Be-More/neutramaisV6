import { Suspense } from "react";

import AcceptInvite from "@/components/AcceptInvite";
import AuthLayout from "@/components/AuthLayout";

// Endereço antigo do aceite de convite de operador. Os links novos usam
// `/accept/#token=...`; este segue funcionando (fragmento ou `?token=`) com o
// mesmo aceite unificado.
export default function AcceptPlatformInvitePage() {
  return (
    <AuthLayout>
      <Suspense>
        <AcceptInvite />
      </Suspense>
    </AuthLayout>
  );
}
