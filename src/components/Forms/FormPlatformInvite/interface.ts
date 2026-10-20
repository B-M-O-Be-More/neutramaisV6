import { InferType } from "yup";

import { platformInviteSchema } from "@/schemas/platformInvite";

export type PlatformInviteValues = InferType<typeof platformInviteSchema>;

export interface FormPlatformInviteProps {
  /** Envia o convite; true limpa o formulário para o próximo. */
  onSubmit: (values: PlatformInviteValues) => Promise<boolean>;
  isSubmitting?: boolean;
  /** Erro do último envio (chave de tradução). */
  formError?: string;
  /** E-mail do último convite enviado — mostra a confirmação. */
  sentTo?: string;
}
