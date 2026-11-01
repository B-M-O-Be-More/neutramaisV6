import type { CoverageVersionSummary } from "@/services/geoCoverage.service";

export interface UseCoverageFilesReturn {
  /**
   * Versão ativa de cada arquivo não arquivado, da mais recente para a mais
   * antiga. Ao recarregar, mantém a lista anterior até a nova chegar.
   */
  versions: CoverageVersionSummary[];
  /** Primeira carga (ainda sem lista). */
  isLoading: boolean;
  /** Chave de tradução quando a listagem falhou. */
  error: string | null;
  reload: () => void;
}
