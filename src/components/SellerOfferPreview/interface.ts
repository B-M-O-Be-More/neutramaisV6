import type { OfferCategory } from "@/data/offerCategories";

export interface SellerOfferPreviewProps {
  category: OfferCategory | null;
  name?: string;
  description?: string;
  /** Imagem escolhida na etapa 2 (URL local); ausente mostra "Sem imagem". */
  imageUrl?: string | null;
  /** Preço mensal; ausente mostra zero. */
  monthlyPrice?: number | null;
  /** Código ISO da moeda (padrão BRL). */
  currency?: string;
  /** Período do preço já traduzido (ex.: "/ mês"); ausente em pagamento único. */
  priceSuffix?: string;
  /** Textos livres das etapas seguintes (ex.: "99,5%", "48h"). */
  technicalSla?: string;
  acceptanceSla?: string;
  /** Idioma para a moeda (ex.: "pt-BR"). */
  locale: string;
}
