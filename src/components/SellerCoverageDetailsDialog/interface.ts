import type { CoverageGeoJson } from "@/components/CoverageMap";
import type { CoverageVersionSummary } from "@/services/geoCoverage.service";

export interface SellerCoverageDetailsDialogProps {
  /** Cobertura aberta; null fecha o diálogo. */
  version: CoverageVersionSummary | null;
  /** Geometria lida do KMZ (no envio ou do original baixado). */
  geometry: CoverageGeoJson | null;
  /** Baixando e lendo o KMZ original. */
  isLoadingMap?: boolean;
  /** Por que o mapa não carregou (chave de tradução). */
  mapError?: string | null;
  /** Ofertas vinculadas; null quando não se sabe. */
  offerCount: number | null;
  /** Idioma para datas e tamanhos (ex.: "pt-BR"). */
  locale: string;
  onClose: () => void;
}
