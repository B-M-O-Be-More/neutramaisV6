import { Suspense } from "react";

import AuthLayout from "@/components/AuthLayout";
import ForgotPasswordSidebar from "@/components/ForgotPasswordSidebar";
import ResetPassword from "@/components/ResetPassword";

// Página aberta pelo link de redefinição enviado por e-mail (`?token=...`).
// useSearchParams exige um limite de Suspense no App Router.
export default function ResetPasswordPage() {
  return (
    <AuthLayout sidebar={<ForgotPasswordSidebar />}>
      <Suspense>
        <ResetPassword />
      </Suspense>
    </AuthLayout>
  );
}
