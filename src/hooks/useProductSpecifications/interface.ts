import type { ProductSpecification } from "@/services/productCatalog.service";

export type { ProductSpecification };

export interface UseProductSpecificationsReturn {
  specifications: ProductSpecification[];
  isLoading: boolean;
}
