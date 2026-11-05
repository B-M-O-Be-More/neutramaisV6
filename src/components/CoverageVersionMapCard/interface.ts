import type { CoverageGeoJson } from "@/components/CoverageMap";

export interface CoverageVersionMapCardProps {
  /** Área da versão ativa (lida do KMZ original); null mostra o vazio. */
  geometry: CoverageGeoJson | null;
  /** Baixando e lendo o KMZ original. */
  isLoading?: boolean;
  /** Por que o mapa não carregou (chave de tradução). */
  error?: string | null;
  /** Nomes dos placemarks com área; vazio esconde a seção. */
  regions: string[];
}
