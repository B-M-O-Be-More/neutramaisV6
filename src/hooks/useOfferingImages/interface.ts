import type { OfferingImage } from "@/services/productCatalog.service";

export interface UseOfferingImagesReturn {
  /** Só as confirmadas, na ordem da oferta (a primeira é a capa). */
  images: OfferingImage[];
  isLoading: boolean;
  hasError: boolean;
  refetch: () => void;
}
