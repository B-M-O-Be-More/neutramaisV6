/**
 * Cenários de KYC sem envio de documentos:
 * - `review`    — documentação em análise pelo admin
 * - `approved`  — nível verificado aprovado
 * - `complete`  — KYC completo
 * - `rejected`  — solicitação recusada; o caminho é o suporte
 * - `suspended` — KYC suspenso; o caminho é o suporte
 */
export type KycStatusVariant =
  | "review"
  | "approved"
  | "complete"
  | "rejected"
  | "suspended";

export interface KycStatusProps {
  variant: KycStatusVariant;
  /** Ação do botão principal (hoje, ir para o dashboard). */
  onContinue: () => void;
  /**
   * Só em `review`: abre o reenvio para quem recebeu um pedido de correção.
   * O estado do KYC não distingue esse caso — o aviso chega por e-mail.
   */
  onCorrection?: () => void;
}
