import type { SellerOfferValues } from "@/schemas/sellerOffer";
import type {
  OfferingImage,
  ProductOffering,
} from "@/services/productCatalog.service";

/** Oferta recém-criada, com os valores já formatados para exibição. */
export interface PublishedOffer {
  offeringId: string;
  /**
   * Criada como rascunho porque a categoria exige cobertura (KMZ), que só é
   * vinculada depois. Sem isso, a oferta já foi publicada.
   */
  needsCoverage: boolean;
  name: string;
  /** Nome da categoria já traduzido. */
  categoryLabel: string;
  /** Preço formatado com a moeda (ex.: "BRL 1.890,00"). */
  price: string;
  /** SLA de aceite formatado (ex.: "48h"). */
  acceptanceSla: string;
  /** Avisos já traduzidos (ex.: patrocínio sem permissão). */
  warnings: string[];
}

interface FormSellerOfferBaseProps {
  /** Organização do seller (dona das versões de KMZ e da oferta). */
  organizationId: string | null;
  /** Idioma para moeda, datas e tamanhos (ex.: "pt-BR"). */
  locale: string;
  /** "Voltar" na primeira etapa — sai do assistente. */
  onCancel: () => void;
}

/** Criação: a revisão final cria e publica a oferta. */
interface FormSellerOfferCreateProps extends FormSellerOfferBaseProps {
  mode?: "create";
  /** Oferta publicada, ou criada à espera da cobertura. */
  onPublished: (offer: PublishedOffer) => void;
}

/** Edição: as etapas abrem preenchidas e a revisão salva sem mudar o status. */
interface FormSellerOfferEditProps extends FormSellerOfferBaseProps {
  mode: "edit";
  offering: ProductOffering;
  /** Valores da oferta salva (ver `offeringToFormValues`). */
  initialValues: SellerOfferValues;
  /** Fotos confirmadas, na ordem da oferta (área de fotos da etapa 2). */
  images: OfferingImage[];
  /** Etapa aberta de início (ex.: 1 para ir direto às fotos; 0, cobertura). */
  initialStep?: number;
  /** Alterações salvas; avisos já traduzidos (ex.: patrocínio). */
  onSaved: (warnings: string[]) => void;
}

export type FormSellerOfferProps =
  | FormSellerOfferCreateProps
  | FormSellerOfferEditProps;
