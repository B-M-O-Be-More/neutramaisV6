import type { ProductSpecification } from "@/services/productCatalog.service";
import type { SellerOrderStatus } from "@/types/sellerOrders";

export type SellerOrdersStatusFilter = SellerOrderStatus | "all";

export interface SellerOrdersFiltersValue {
  /** Número do pedido, produto ou CNPJ do comprador. */
  search: string;
  /** Especificação (categoria) do produto; vazio = todas. */
  specificationId: string;
  status: SellerOrdersStatusFilter;
}

export interface SellerOrdersFiltersProps {
  value: SellerOrdersFiltersValue;
  onChange: (value: SellerOrdersFiltersValue) => void;
  specifications: ProductSpecification[];
  /** Pedidos por status; zero ou ausente = contador oculto. */
  counts?: Partial<Record<SellerOrderStatus, number>>;
}
