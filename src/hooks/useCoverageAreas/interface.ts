import type { CoverageArea } from "@/functions/coverageAreas";

export interface UseCoverageAreasReturn {
  /** Áreas com polígono da versão, na ordem do KMZ; vazia sem versão. */
  areas: CoverageArea[];
  isLoading: boolean;
  /** Chave de tradução quando a lista não pôde ser lida. */
  error?: string;
  /** O KMZ tem mais placemarks do que a tela lê: a lista está incompleta. */
  truncated: boolean;
}
