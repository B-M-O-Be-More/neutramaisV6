import type { PlatformRole } from "@/services/platformInvites.service";

export interface InvitePlatformOperatorInput {
  email: string;
  targetRole: PlatformRole;
}

export interface UseInvitePlatformOperatorReturn {
  isSubmitting: boolean;
  /** Chave de tradução do erro do último envio, ou undefined. */
  formError?: string;
  /** E-mail do último convite enviado com sucesso. */
  sentTo?: string;
  /** Envia o convite; true quando a API aceitou. */
  invite: (input: InvitePlatformOperatorInput) => Promise<boolean>;
}
