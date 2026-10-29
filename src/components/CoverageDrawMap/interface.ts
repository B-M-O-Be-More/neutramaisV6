import type { CoverageGeoJson } from "@/components/CoverageMap";
import type { LngLat } from "@/functions/geoShapes";
import type { CoverageScopeMode } from "@/schemas/sellerOffer";

export interface CoverageDrawMapProps {
  /** Área do KMZ selecionado; null quando a geometria não é conhecida. */
  coverage: CoverageGeoJson | null;
  mode: CoverageScopeMode;
  /** Polígonos já fechados (vértices sem o ponto de fechamento). */
  shapes: LngLat[][];
  /** Vértices do polígono em desenho, na ordem dos cliques. */
  draft: LngLat[];
  /** Índice do polígono destacado; null quando nenhum. */
  selected: number | null;
  onAddPoint: (point: LngLat) => void;
  /** Fecha o polígono em desenho (clique no primeiro ponto). */
  onCloseShape: () => void;
  /** Clique num polígono (índice) ou fora dele (null). */
  onSelect: (index: number | null) => void;
  onCancelDraft: () => void;
  /** Apaga todos os polígonos. */
  onClear: () => void;
  /** Leva o mapa até um ponto (ex.: localização buscada). */
  focus?: { longitude: number; latitude: number } | null;
  /** Rótulo acessível do mapa. */
  label: string;
}
