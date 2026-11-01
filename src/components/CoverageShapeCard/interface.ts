import type { CoverageShapeSummary } from "@/components/CoverageShapeList";

export interface CoverageShapeCardProps {
  shape: CoverageShapeSummary;
  onRemove: () => void;
  onClose: () => void;
  /** Idioma para a área (ex.: "pt-BR"). */
  locale: string;
}
