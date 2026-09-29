"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import AuthLayout from "@/components/AuthLayout";
import RegisterSidebar from "@/components/RegisterSidebar";
import FormRegister from "@/components/Forms/FormRegister";
import { RegisterFlowProvider } from "@/contexts/RegisterFlowContext";

// Perfis aceitos em `?type=` — os CTAs da home já abrem o cadastro com o
// perfil (comprador/vendedor) pré-selecionado.
const REGISTER_TYPES = ["buyer", "seller"] as const;
type RegisterTypeParam = (typeof REGISTER_TYPES)[number];

function RegisterContent() {
  const typeParam = useSearchParams().get("type");
  const typeRegister = REGISTER_TYPES.includes(typeParam as RegisterTypeParam)
    ? (typeParam as RegisterTypeParam)
    : undefined;

  return (
    <RegisterFlowProvider>
      <AuthLayout sidebar={<RegisterSidebar />}>
        <FormRegister typeRegister={typeRegister} />
      </AuthLayout>
    </RegisterFlowProvider>
  );
}

// O RegisterFlowProvider lê `?resume=` para reposicionar o stepper quando o
// usuário volta pelo link de confirmação de e-mail — e useSearchParams exige um
// limite de Suspense no App Router.
export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
