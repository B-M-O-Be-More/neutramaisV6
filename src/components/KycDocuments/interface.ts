import type { KycLevelSupported } from "@/services/kyc.service";

/**
 * Cenário que abre a tela — muda só o cabeçalho:
 * - `submit`   — primeiro envio ("Conta criada!")
 * - `upgrade`  — já tem um nível concedido e quer subir
 * - `resubmit` — a análise pediu correção; reenvia o conjunto do nível
 */
export type KycDocumentsVariant = "submit" | "upgrade" | "resubmit";

export interface KycDocumentsProps {
  /** Id da organização (`organization.id` do `/me`). */
  organizationId?: string;
  /**
   * Nível já concedido (`organization.kyc_level` do `/me`). Só os níveis
   * acima dele podem ser pedidos. Padrão: `pending`.
   */
  currentLevel?: KycLevelSupported;
  /** Padrão: `submit`. */
  variant?: KycDocumentsVariant;
  /** Encerra a tela — quem decide para onde ir é a página. */
  onFinish: () => void;
}
