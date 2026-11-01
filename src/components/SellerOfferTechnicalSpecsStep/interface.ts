import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";

import type { SellerOfferValues } from "@/schemas/sellerOffer";

export interface SellerOfferTechnicalSpecsStepProps {
  control: Control<SellerOfferValues>;
  register: UseFormRegister<SellerOfferValues>;
  errors: FieldErrors<SellerOfferValues>;
}
