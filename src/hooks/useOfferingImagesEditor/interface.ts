import type { OfferImageItem } from "@/schemas/sellerOffer";

/** Resultado do último "Confirmar fotos" (chaves de tradução). */
export interface OfferingImagesNotice {
  tone: "success" | "warning" | "error";
  messages: string[];
}

export interface UseOfferingImagesEditorReturn {
  /** Fotos na ordem escolhida — a primeira é a capa. */
  items: OfferImageItem[];
  setItems: (items: OfferImageItem[]) => void;
  /** Erro (chave de tradução) de cada foto, na mesma ordem. */
  itemErrors: (string | undefined)[];
  /** Há mudança que ainda não foi enviada. */
  isDirty: boolean;
  isConfirming: boolean;
  /** Pode confirmar: mudou, sem erros e sem envio em andamento. */
  canConfirm: boolean;
  notice: OfferingImagesNotice | null;
  /** Envia na hora: remove, envia as novas e ajusta a ordem. */
  confirm: () => Promise<void>;
}
