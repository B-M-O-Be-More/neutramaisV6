/**
 * Estados da confirmação do telefone na etapa de Verificação (US-02):
 * - `idle`      — nenhum código enviado ainda; o campo de OTP fica desabilitado
 *                 e a ação é "Enviar código"
 * - `sent`      — o SMS saiu; o campo é habilitado e a ação vira "Validar"
 * - `confirmed` — o OTP foi aceito pelo backend
 */
export type ConfirmPhoneStatus = "idle" | "sent" | "confirmed";

export interface UseConfirmPhoneResult {
  status: ConfirmPhoneStatus;
  /** Request em voo (envio do código ou validação). */
  loading: boolean;
  /** Chave de tradução do erro corrente, ou null. */
  error: string | null;
  /** POST /auth/resend-phone-otp — dispara (ou reenvia) o SMS. */
  sendCode: () => Promise<void>;
  /** POST /auth/confirm-phone — valida o OTP digitado. */
  confirm: (otp: string) => Promise<boolean>;
}
