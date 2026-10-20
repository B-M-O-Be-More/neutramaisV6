/**
 * Cenário que abre a tela — muda só o cabeçalho:
 * - `submit`   — primeiro envio ("Conta criada!")
 * - `resubmit` — o admin pediu mais documentos
 * - `rejected` — a documentação foi recusada; pode reenviar
 */
export type KycDocumentsVariant = "submit" | "resubmit" | "rejected";

export interface KycDocumentsProps {
  /** Id da organização (`organization.id` do `/me`). */
  organizationId?: string;
  /** Padrão: `submit`. */
  variant?: KycDocumentsVariant;
  /** Encerra a tela — quem decide para onde ir é a página. */
  onFinish: () => void;
}
