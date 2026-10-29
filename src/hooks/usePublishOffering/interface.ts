import type { SellerOfferValues } from "@/schemas/sellerOffer";

export type PublishOfferingOutcome =
  /** Criada, vinculada e publicada. */
  | { status: "published"; offeringId: string; warnings: string[] }
  /**
   * Criada, mas não publicada (vínculo da cobertura ou publicação falharam):
   * fica como rascunho em Minhas Ofertas.
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
  publish: (values: SellerOfferValues) => Promise<PublishOfferingOutcome>;
}
