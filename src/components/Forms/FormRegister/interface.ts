import { InferType } from "yup";

import { registerFlowSchema } from "@/schemas/register";

export type RegisterType = "seller" | "buyer";

/** Valores do formulário unificado de cadastro (tipo + empresa + endereço + responsável). */
export type RegisterFlowValues = InferType<typeof registerFlowSchema>;

export interface FormRegisterProps {
  /** Tipo pré-selecionado. Se omitido, a etapa 1 (tipo de conta) inicia vazia. */
  typeRegister?: RegisterType;
}
