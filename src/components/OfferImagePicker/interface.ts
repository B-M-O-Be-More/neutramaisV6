import type { OfferImageItem } from "@/schemas/sellerOffer";

export interface OfferImagePickerProps {
  /** Imagens na ordem da oferta — a primeira é a capa. */
  value: OfferImageItem[];
  onChange: (items: OfferImageItem[]) => void;
  /** Erros (já traduzidos) por posição da lista. */
  itemErrors?: (string | undefined)[];
  /** Envio em andamento: escolher, mover e remover ficam travados. */
  disabled?: boolean;
}
