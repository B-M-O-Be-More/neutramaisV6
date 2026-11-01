import type { CoverageGeometryStats } from "@/functions/coverageGeometryStats";

export interface CoverageVersionStatsProps {
  /** Número da versão ativa no histórico (v4); null sem histórico. */
  versionNumber: number | null;
  /** Tamanho do KMZ original, quando foi baixado. */
  sizeBytes?: number;
  /** Contagens lidas do KMZ; null enquanto não foi lido. */
  stats: CoverageGeometryStats | null;
  /** Ofertas vinculadas à versão ativa. */
  offerCount: number;
  /** Idioma do tamanho (ex.: "pt-BR"). */
  locale: string;
}
