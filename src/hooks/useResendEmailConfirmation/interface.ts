/**
 * Estados do reenvio do link de confirmação na etapa de Verificação:
 * - `idle` — nenhum reenvio feito nesta tela
 * - `sent` — o backend aceitou o reenvio; um link novo saiu para o e-mail
 */
export type ResendEmailConfirmationStatus = "idle" | "sent";

export interface UseResendEmailConfirmationResult {
  status: ResendEmailConfirmationStatus;
  /** Request em voo. */
  loading: boolean;
  /** Chave de tradução do erro corrente, ou null. */
  error: string | null;
  /** POST /users/{user_id}/resend-email-confirmation. */
  resend: () => Promise<void>;
}
