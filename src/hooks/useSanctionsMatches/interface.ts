import type { SanctionsMatch } from "@/services/admin.service";

export type { SanctionsMatch };

export interface UseSanctionsMatchesOptions {
  organizationId: string;
  /** Só consulta quando a checagem de sanções falhou. */
  enabled: boolean;
  /**
   * Muda a cada nova checagem rodada na tela (ex.: `screening_run_id`), para
   * a lista acompanhar o resultado.
   */
  refreshKey?: string | null;
}

export interface UseSanctionsMatchesReturn {
  matches: SanctionsMatch[];
  isLoading: boolean;
  /** Chave de tradução do erro; null sem erro. */
  error: string | null;
  reload: () => void;
}
