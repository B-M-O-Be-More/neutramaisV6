import type { CoverageGeoJson } from "@/components/CoverageMap";
import type { PublicGeometry } from "@/functions/geoShapes";
import type { CoverageScopeMode } from "@/schemas/sellerOffer";

export interface CoverageScope {
  mode: CoverageScopeMode;
  /**
   * Polígonos desenhados (`custom`) ou o desenho das áreas escolhidas
   * (`areas`); null na cobertura completa.
   */
  publicGeometry: PublicGeometry | null;
  /** Índices das áreas do KMZ escolhidas (`areas`). */
  areaIndexes?: number[];
}

export interface CoverageScopeDialogProps {
  open: boolean;
  /** Área do KMZ selecionado; null quando a geometria não é conhecida. */
  coverage: CoverageGeoJson | null;
  /** Versão do KMZ — as áreas escolhíveis vêm dela na geo-api. */
  versionId: string | null;
  /** Escolha atual do formulário — ponto de partida ao abrir. */
  value: CoverageScope;
  onConfirm: (scope: CoverageScope) => void;
  onClose: () => void;
}
