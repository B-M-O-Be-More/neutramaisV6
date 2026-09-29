"use client";

import { useSearchParams } from "next/navigation";
import React from "react";

import {
  REGISTER_STEPS,
  RegisterFlowContextProps,
  RegisterFlowProviderProps,
  RegisterStepId,
} from "./interface";

/**
 * Valor de `?resume=` que reposiciona o stepper. Usado pelo retorno do link de
 * confirmação de e-mail (/confirm-email → /register?resume=verify).
 *
 * A etapa vem da URL, e não do localStorage, de propósito: assim o passo inicial
 * é determinístico no primeiro render e não exige sincronizar estado dentro de um
 * efeito (que causaria render em cascata).
 */
export const RESUME_PARAM = "resume";

const RESUME_STEPS: Record<string, number> = {
  // O link do e-mail volta para a própria Verificação: com o e-mail confirmado,
  // é ali que a confirmação do telefone é liberada.
  verify: REGISTER_STEPS.findIndex((step) => step.id === "verify"),
  kyc: REGISTER_STEPS.findIndex((step) => step.id === "kyc"),
};

const RegisterFlowContext = React.createContext<RegisterFlowContextProps>({
  step: 0,
  setStep: () => {},
  resumedFrom: null,
});

/**
 * Estado do fluxo de cadastro compartilhado entre a barra lateral (RegisterSidebar,
 * que marca a etapa atual) e os formulários (FormRegister/Payer/Seller, que avançam
 * as etapas). Provido no nível da página de registro.
 */
const RegisterFlowProvider: React.FC<RegisterFlowProviderProps> = ({
  children,
}) => {
  const searchParams = useSearchParams();

  // Ambos lidos só no primeiro render: depois disso o stepper é controlado pelo
  // usuário, e mudar a URL (ex.: o `replace` que avança para o KYC) não deve
  // arrastá-lo de volta nem reescrever a origem da retomada.
  const [resumedFrom] = React.useState<RegisterStepId | null>(() => {
    const resume = searchParams.get(RESUME_PARAM);
    return resume && resume in RESUME_STEPS ? (resume as RegisterStepId) : null;
  });

  const [step, setStep] = React.useState<number>(() => {
    const target = resumedFrom ? RESUME_STEPS[resumedFrom] : undefined;
    return target !== undefined && target >= 0 ? target : 0;
  });

  return (
    <RegisterFlowContext.Provider value={{ step, setStep, resumedFrom }}>
      {children}
    </RegisterFlowContext.Provider>
  );
};

function useRegisterFlow() {
  const context = React.useContext(RegisterFlowContext);
  if (!context) {
    throw new Error(
      "useRegisterFlow must be used within a RegisterFlowProvider",
    );
  }
  return context;
}

export { RegisterFlowProvider, useRegisterFlow };
