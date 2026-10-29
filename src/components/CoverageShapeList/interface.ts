/**
 * Problema que faz a geo-api recusar o polígono: ele se cruza (ou não tem
 * área), encosta em outro polígono ou sai da área do KMZ.
 */
export type CoverageShapeIssue = "invalid" | "overlap" | "outside";

/** Resumo de um polígono desenhado na "Cobertura editada". */
export interface CoverageShapeSummary {
  /** Número exibido ("Polígono 1"), a partir de 1. */
  number: number;
  areaKm2: number;
  vertices: number;
  /** null quando o polígono pode ser enviado. */
  issue: CoverageShapeIssue | null;
}

export interface CoverageShapeListProps {
  shapes: CoverageShapeSummary[];
  /** Índice do polígono destacado; null quando nenhum. */
  selected: number | null;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  /** Idioma para a área (ex.: "pt-BR"). */
  locale: string;
}
