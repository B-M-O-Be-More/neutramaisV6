import type { CoverageGeoJson } from "@/components/CoverageMap";
import type { PublicGeometry } from "@/functions/geoShapes";
import type { CoverageScopeMode } from "@/schemas/sellerOffer";

export interface CoverageScope {
  mode: CoverageScopeMode;
  /** Polígonos desenhados; null na cobertura completa. */
  publicGeometry: PublicGeometry | null;
}

export interface CoverageScopeDialogProps {
  open: boolean;
  /** Área do KMZ selecionado; null quando a geometria não é conhecida. */
  coverage: CoverageGeoJson | null;
  /** Escolha atual do formulário — ponto de partida ao abrir. */
  value: CoverageScope;
  onConfirm: (scope: CoverageScope) => void;
  onClose: () => void;
}
