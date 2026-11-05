import type { IconType } from "react-icons";
import {
  LuAppWindow,
  LuBoxes,
  LuHash,
  LuNetwork,
  LuRouter,
  LuServer,
  LuWifi,
} from "react-icons/lu";

// Famílias de oferta do marketplace (Figma 2664-55368): as categorias raiz da
// plataforma que têm tela própria no assistente. Os textos vêm do i18n
// (SellerOfferCreate.categories.<key>). A árvore real (subcategorias e
// categorias novas) vem da API — ver `useOfferCategories`; uma raiz sem tela
// própria cai na família `custom`, só com os campos do template.
export type OfferCategory =
  | "connectivity"
  | "physicalInfra"
  | "hardware"
  | "numberingResources"
  | "software"
  | "protocols"
  | "custom";

export interface OfferCategoryDefinition {
  key: OfferCategory;
  icon: IconType;
  /** Conectividade e infra física precisam de uma versão de KMZ vinculada. */
  requiresCoverage: boolean;
  /**
   * Sem KMZ, a abrangência é informada como texto livre (ex.: recursos
   * numéricos por região/registro — LACNIC, ANATEL).
   */
  asksRegion?: boolean;
  /**
   * Nome do plano (productSpecification) que agrupa as ofertas da categoria
   * na marketplace-api. Fixo em português, igual em qualquer idioma da tela —
   * é por ele que o plano é encontrado ao publicar.
   */
  specificationName: string;
  /**
   * Categoria da árvore da plataforma (`GET /productCatalog/category`). O
   * plano é criado nela e segue o template dela (`characteristics`).
   */
  categoryId: string;
  /** Publicar exige `stockQuantity` na oferta (categoria com estoque numérico). */
  hasNumericStock?: boolean;
  tone: { fg: string; bg: string; border: string };
}

// Ordem do design: Conectividade, Infra Física, Hardware / CPE, Recursos
// Numéricos, Softwares e Gerenciamento, Protocolos e Serviços.
export const OFFER_CATEGORIES: OfferCategoryDefinition[] = [
  {
    key: "connectivity",
    specificationName: "Conectividade",
    categoryId: "0193a000-0000-7000-8000-000000000c01",
    icon: LuWifi,
    requiresCoverage: true,
    tone: { fg: "#1F5AFF", bg: "#EEF3FF", border: "#C7D8FF" },
  },
  {
    key: "physicalInfra",
    specificationName: "Infra Física",
    categoryId: "0193a000-0000-7000-8000-000000000c02",
    icon: LuServer,
    requiresCoverage: true,
    tone: { fg: "#8B5CF6", bg: "#F3EEFF", border: "#D3BFFD" },
  },
  {
    key: "hardware",
    specificationName: "Hardware / CPE",
    categoryId: "0193a000-0000-7000-8000-000000000c03",
    hasNumericStock: true,
    icon: LuRouter,
    requiresCoverage: false,
    tone: { fg: "#10B981", bg: "#EDFBF5", border: "#AAECD5" },
  },
  {
    key: "numberingResources",
    specificationName: "Recursos Numéricos",
    categoryId: "0193a000-0000-7000-8000-000000000c04",
    hasNumericStock: true,
    icon: LuHash,
    requiresCoverage: false,
    asksRegion: true,
    tone: { fg: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  },
  {
    key: "software",
    specificationName: "Softwares e Gerenciamento",
    categoryId: "0193a000-0000-7000-8000-000000000c05",
    icon: LuAppWindow,
    requiresCoverage: false,
    tone: { fg: "#E11D48", bg: "#FFF1F2", border: "#FECDD3" },
  },
  {
    key: "protocols",
    specificationName: "Protocolos e Serviços",
    categoryId: "0193a000-0000-7000-8000-000000000c06",
    icon: LuNetwork,
    requiresCoverage: false,
    tone: { fg: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" },
  },
];

/**
 * Raiz da API sem tela própria (criada pelo Admin depois do design): só os
 * campos do template. `categoryId` e as flags vêm da categoria escolhida.
 */
export const CUSTOM_OFFER_CATEGORY: OfferCategoryDefinition = {
  key: "custom",
  specificationName: "",
  categoryId: "",
  icon: LuBoxes,
  requiresCoverage: false,
  tone: { fg: "#475569", bg: "#F1F5F9", border: "#CBD5E1" },
};

/** Família pelo `categoryId` da raiz na API; desconhecido devolve `undefined`. */
export function offerCategoryById(
  categoryId: string | null | undefined,
): OfferCategoryDefinition | undefined {
  return OFFER_CATEGORIES.find(
    (category) => category.categoryId === categoryId,
  );
}

/** Definição da família; vazio ou desconhecido devolve `undefined`. */
export function offerCategory(
  key: OfferCategory | "" | null | undefined,
): OfferCategoryDefinition | undefined {
  if (key === "custom") return CUSTOM_OFFER_CATEGORY;
  return OFFER_CATEGORIES.find((category) => category.key === key);
}
