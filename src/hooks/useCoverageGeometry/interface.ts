import type { CoverageGeoJson } from "@/components/CoverageMap";

/** O que foi lido do KMZ original baixado. */
export interface CoverageGeometryInfo {
  sizeBytes: number;
  regionCount?: number;
  polygonCount?: number;
}

export interface UseCoverageGeometryReturn {
  /** Área da versão; null sem versão, carregando, em erro ou sem prévia. */
  geometry: CoverageGeoJson | null;
  /** Tamanho e contagens do original baixado (null se não baixou). */
  info: CoverageGeometryInfo | null;
  isLoading: boolean;
  /** Chave de tradução quando o mapa não pôde ser carregado. */
  error: string | null;
}
