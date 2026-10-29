import type { CoverageGeoJson } from "@/components/CoverageMap";
import type { CoverageVersionSummary } from "@/services/geoCoverage.service";

/** Cobertura salva: versão criada na geo-api e a geometria lida do KMZ. */
export interface SavedCoverage {
  version: CoverageVersionSummary;
  geometry: CoverageGeoJson | null;
}

export interface FormSellerCoverageProps {
  /** Organização do seller (dona das versões de KMZ). */
  organizationId: string | null;
  /** Só o Dono sobe KMZ: sem permissão, o formulário fica desabilitado. */
  canUpload: boolean;
  /** Idioma para o tamanho do arquivo (ex.: "pt-BR"). */
  locale: string;
  onSaved: (coverage: SavedCoverage) => void;
}
