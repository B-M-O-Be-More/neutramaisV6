import type { SellerOfferValues } from "@/schemas/sellerOffer";
import type { OfferTemplate } from "@/functions/templateFields";
import type { ProductOffering } from "@/services/productCatalog.service";

export type UpdateOfferingOutcome =
  /** Alterações salvas; avisos de passos opcionais (ex.: patrocínio). */
  | { status: "saved"; warnings: string[] }
  /** Nada (ou só parte) foi salvo. Chave de tradução do erro. */
  | { status: "failed"; errorKey: string };

export interface UseUpdateOfferingReturn {
  isSaving: boolean;
  save: (
    offering: ProductOffering,
    values: SellerOfferValues,
    /** Valores de quando o formulário abriu: mesma categoria mantém o plano. */
    initialValues?: SellerOfferValues,
    /** Campos genéricos e regras do template da categoria. */
    template?: OfferTemplate,
  ) => Promise<UpdateOfferingOutcome>;
}
