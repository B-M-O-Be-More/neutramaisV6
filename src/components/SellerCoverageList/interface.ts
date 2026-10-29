import type { CoverageVersionSummary } from "@/services/geoCoverage.service";

export interface SellerCoverageListProps {
  /** Coberturas da organização (geo-api), mais recente primeiro. */
  versions: CoverageVersionSummary[];
  /** Primeira carga da lista. */
  isLoading?: boolean;
  /** Falha da listagem (já traduzida). */
  error?: string | null;
  onRetry?: () => void;
  /** Ofertas por versão de cobertura; null enquanto carrega ou em erro. */
  offerCounts: Map<string, number> | null;
  /** Idioma para datas (ex.: "pt-BR"). */
  locale: string;
  onDetails: (version: CoverageVersionSummary) => void;
}
