import type { CoverageArea } from "@/functions/coverageAreas";

export interface CoverageAreaListProps {
  /** Áreas com polígono do KMZ, na ordem do arquivo. */
  areas: CoverageArea[];
  /** Índices das áreas escolhidas. */
  selected: number[];
  /** Nova escolha (marcar, desmarcar, todas ou nenhuma). */
  onChange: (selected: number[]) => void;
  isLoading: boolean;
  /** Chave de tradução quando as áreas não puderam ser lidas. */
  error?: string;
  /** O KMZ tem mais placemarks do que a lista mostra. */
  truncated: boolean;
  /** Idioma para as áreas em km² (ex.: "pt-BR"). */
  locale: string;
}
