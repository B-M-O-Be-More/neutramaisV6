import type {
  CoverageFilePreview,
  CoverageFileVersion,
  CoverageVersionSummary,
} from "@/services/geoCoverage.service";

export interface UseCoverageFileDetailReturn {
  /** Ciclo de vida do arquivo (versão ativa, vínculos, `previewRevision`). */
  preview: CoverageFilePreview | null;
  /** Histórico do arquivo, da versão mais recente para a mais antiga. */
  versions: CoverageFileVersion[];
  /** Ofertas por versão (`versionId` → quantidade). */
  offerCounts: Map<string, number>;
  /** Metadados da versão ativa (para o mapa e o download do original). */
  activeVersion: CoverageVersionSummary | null;
  /** Primeira carga (ainda sem dados). */
  isLoading: boolean;
  /** Chave de tradução quando a leitura falhou. */
  error: string | null;
  /** Lê tudo de novo (depois de restaurar ou enviar uma versão). */
  reload: () => void;
}
