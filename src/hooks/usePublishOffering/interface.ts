import type { SellerOfferValues } from "@/schemas/sellerOffer";
import type { OfferTemplate } from "@/functions/templateFields";

export type PublishOfferingOutcome =
  /** Criada e publicada. */
  | { status: "published"; offeringId: string; warnings: string[] }
  /**
   * Criada como rascunho de propósito: a categoria exige cobertura (KMZ), que
   * só é vinculada depois, na edição da oferta.
   */
  | { status: "needsCoverage"; offeringId: string; warnings: string[] }
  /**
   * Criada, mas a publicação falhou: fica como rascunho em Minhas Ofertas.
   */
  | {
      status: "draft";
      offeringId: string;
      /** Chave de tradução do motivo. */
      reasonKey: string;
      warnings: string[];
    }
  /** Nada foi criado. */
  | { status: "failed"; /** Chave de tradução do erro. */ errorKey: string };

export interface UsePublishOfferingReturn {
  isPublishing: boolean;
  /** Oferta já criada numa tentativa anterior (retomada sem duplicar). */
  createdOfferingId: string | null;
  /** `template`: campos genéricos e regras do template da categoria. */
  publish: (
    values: SellerOfferValues,
    template?: OfferTemplate,
  ) => Promise<PublishOfferingOutcome>;
}
