"use client";

import { Suspense } from "react";

import AuthLayout from "@/components/AuthLayout";
import RegisterSidebar from "@/components/RegisterSidebar";
import FormRegister from "@/components/Forms/FormRegister";
import { RegisterFlowProvider } from "@/contexts/RegisterFlowContext";

// O RegisterFlowProvider lê `?resume=` para reposicionar o stepper quando o
// usuário volta pelo link de confirmação de e-mail — e useSearchParams exige um
// limite de Suspense no App Router.
export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterFlowProvider>
        <AuthLayout sidebar={<RegisterSidebar />}>
          <FormRegister />
        </AuthLayout>
      </RegisterFlowProvider>
    </Suspense>
  );
}
