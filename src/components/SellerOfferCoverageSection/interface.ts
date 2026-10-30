import type { CoverageMapLocation } from "@/components/CoverageMap";
import type { UseOfferingCoverageEditorReturn } from "@/hooks/useOfferingCoverageEditor";

export interface SellerOfferCoverageSectionProps {
  /** Estado da área de cobertura (ver `useOfferingCoverageEditor`). */
  editor: UseOfferingCoverageEditorReturn;
  /** Organização do seller — dona dos KMZs. */
  organizationId: string | null;
  /** Pins e raios das localidades de atendimento, desenhados no mapa. */
  mapLocations?: CoverageMapLocation[];
  /** Idioma para datas e tamanhos (ex.: "pt-BR"). */
  locale: string;
}
