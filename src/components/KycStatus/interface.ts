/**
 * Cenários de KYC sem envio de documentos:
 * - `review`   — documentação em análise pelo admin
 * - `approved` — aprovada, liberada para operar
 * - `complete` — KYC completo (sanções e endereço)
 */
export type KycStatusVariant = "review" | "approved" | "complete";

export interface KycStatusProps {
  variant: KycStatusVariant;
  /** Ação do botão principal (hoje, ir para o dashboard). */
  onContinue: () => void;
}
