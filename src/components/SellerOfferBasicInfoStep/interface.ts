import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";

import type { UseOfferingImagesEditorReturn } from "@/hooks/useOfferingImagesEditor";
import type { SellerOfferValues } from "@/schemas/sellerOffer";

export interface SellerOfferBasicInfoStepProps {
  control: Control<SellerOfferValues>;
  register: UseFormRegister<SellerOfferValues>;
  errors: FieldErrors<SellerOfferValues>;
  /**
   * Área de fotos — só na edição (a oferta já existe). Sem ela, na criação,
   * a etapa avisa que as fotos entram depois de publicar.
   */
  imagesEditor?: UseOfferingImagesEditorReturn;
}
