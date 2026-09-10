import { ReactNode } from "react";

/**
 * Etapas do fluxo de cadastro, na ordem exibida na barra lateral (Figma).
 * O índice de cada etapa neste array é o valor de `step` no contexto.
 * `built: false` marca etapas ainda não implementadas — a barra as exibe como
 * futuras/bloqueadas e nunca as pinta como concluídas.
 */
export const REGISTER_STEPS = [
  { id: "role", built: true },
  { id: "company", built: true },
  { id: "address", built: true },
  { id: "responsible", built: true },
  { id: "verify", built: true },
  { id: "kyc", built: true },
] as const;

export type RegisterStepId = (typeof REGISTER_STEPS)[number]["id"];

export interface RegisterFlowContextProps {
  /** Índice da etapa atual dentro de REGISTER_STEPS (0 = tipo de conta). */
  step: number;
  setStep: (step: number) => void;
  /**
   * Valor de `?resume=` na montagem, ou null quando a página foi aberta direto.
   * É a prova de que o usuário chegou aqui pelo link do e-mail — só com ela a
   * etapa de Verificação pode afirmar que o e-mail foi validado.
   */
  resumedFrom: RegisterStepId | null;
}

export interface RegisterFlowProviderProps {
  children: ReactNode;
}
