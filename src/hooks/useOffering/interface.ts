import type { ProductOffering } from "@/services/productCatalog.service";

export interface UseOfferingReturn {
  /** Oferta carregada; null até a resposta (ou em erro). */
  offering: ProductOffering | null;
  isLoading: boolean;
  /** Oferta inexistente ou de outra organização (404/403). */
  notFound: boolean;
  hasError: boolean;
  refetch: () => void;
}
