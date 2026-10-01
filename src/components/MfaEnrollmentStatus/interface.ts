import type { MfaEnrollmentFailure } from "@/hooks/useMfaEnrollment";

export interface MfaEnrollmentStatusProps {
  /** Motivo do fim do cadastro — define a tela exibida. */
  failure: MfaEnrollmentFailure;
  /** Segundos estimados até o fim do bloqueio (só em `rateLimit`). */
  retryInSeconds?: number;
  /** Volta às credenciais para recomeçar o login. */
  onBackToLogin: () => void;
}
