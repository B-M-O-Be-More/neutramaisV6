import { Suspense } from "react";

import AcceptInvite from "@/components/AcceptInvite";
import AuthLayout from "@/components/AuthLayout";

// Página pública do aceite de convite (NEU-563): convites de organização e de
// administradores chegam aqui pelo mesmo link, `/accept/#token=<token>`
// (INVITE_ACCEPT_URL na identity-api). Precisa funcionar no acesso direto.
// useSearchParams (alternativa `?token=`) exige um limite de Suspense.
export default function AcceptInvitePage() {
  return (
    <AuthLayout>
      <Suspense>
        <AcceptInvite />
      </Suspense>
    </AuthLayout>
  );
}
