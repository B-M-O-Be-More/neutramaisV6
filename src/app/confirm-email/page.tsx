import { Suspense } from "react";

import AuthLayout from "@/components/AuthLayout";
import ConfirmEmail from "@/components/ConfirmEmail";

// Landing do link enviado por e-mail pelo backend, que aponta para
// `/confirm-email?token=...&user_id=...` — daí esta rota viver na raiz e não sob
// /register. useSearchParams exige um limite de Suspense no App Router.
export default function ConfirmEmailPage() {
  return (
    <AuthLayout>
      <Suspense>
        <ConfirmEmail />
      </Suspense>
    </AuthLayout>
  );
}
