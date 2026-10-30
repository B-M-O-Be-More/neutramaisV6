import type { OfferingsSummary } from "@/services/productCatalog.service";

export type { OfferingsSummary };

export interface UseOfferingsSummaryReturn {
  /** Contadores; null até a primeira resposta (ou em erro). */
  summary: OfferingsSummary | null;
  isLoading: boolean;
  hasError: boolean;
  /** Consulta de novo (ex.: após publicar ou pausar uma oferta). */
  refetch: () => void;
}
