import type { Control, FieldErrors } from "react-hook-form";

import type { OfferCategoryPanelTone } from "@/components/OfferCategoryPanel";
import type { SellerOfferValues } from "@/schemas/sellerOffer";
import type { CategoryTemplateField } from "@/services/productCatalog.service";

export interface SellerOfferTemplateFieldsProps {
  control: Control<SellerOfferValues>;
  errors: FieldErrors<SellerOfferValues>;
  /** Campos do template sem tela própria (`formTemplateFields`). */
  fields: CategoryTemplateField[];
  /** O template da categoria ainda está carregando. */
  isLoading: boolean;
  /** O template não carregou: mostra o aviso com nova tentativa. */
  hasError: boolean;
  onRetry: () => void;
  tone: OfferCategoryPanelTone;
}
