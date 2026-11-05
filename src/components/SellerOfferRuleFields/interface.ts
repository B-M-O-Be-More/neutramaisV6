import type { Control, FieldErrors } from "react-hook-form";

import type { OfferCategoryPanelTone } from "@/components/OfferCategoryPanel";
import type { SellerOfferValues } from "@/schemas/sellerOffer";
import type { CategoryTemplateRule } from "@/services/productCatalog.service";

export interface SellerOfferRuleFieldsProps {
  control: Control<SellerOfferValues>;
  errors: FieldErrors<SellerOfferValues>;
  /** Regras condicionais da categoria escolhida (`useCategoryTemplate`). */
  rules: CategoryTemplateRule[];
  tone: OfferCategoryPanelTone;
}
