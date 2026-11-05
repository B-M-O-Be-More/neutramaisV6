import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";

import type { SellerOfferValues } from "@/schemas/sellerOffer";
import type {
  CategoryTemplateField,
  CategoryTemplateRule,
} from "@/services/productCatalog.service";

export interface SellerOfferTechnicalSpecsStepProps {
  control: Control<SellerOfferValues>;
  register: UseFormRegister<SellerOfferValues>;
  errors: FieldErrors<SellerOfferValues>;
  /** Campos genéricos e regras do template da categoria escolhida. */
  template: {
    fields: CategoryTemplateField[];
    rules: CategoryTemplateRule[];
    isLoading: boolean;
    hasError: boolean;
    onRetry: () => void;
  };
}
