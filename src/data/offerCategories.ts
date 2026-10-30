import type { IconType } from "react-icons";
import {
  LuAppWindow,
  LuHash,
  LuNetwork,
  LuRouter,
  LuServer,
  LuWifi,
} from "react-icons/lu";

// Categorias de oferta do marketplace (Figma 2664-55368). Os textos vêm do
// i18n (SellerOfferCreate.categories.<key>).
export type OfferCategory =
  | "connectivity"
  | "physicalInfra"
  | "hardware"
  | "numberingResources"
  | "software"
  | "protocols";

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
  tone: { fg: string; bg: string; border: string };
}

// Ordem do design: Conectividade, Infra Física, Hardware / CPE, Recursos
// Numéricos, Softwares e Gerenciamento, Protocolos e Serviços.
export const OFFER_CATEGORIES: OfferCategoryDefinition[] = [
  {
    key: "connectivity",
    specificationName: "Conectividade",
    icon: LuWifi,
    requiresCoverage: true,
    tone: { fg: "#1F5AFF", bg: "#EEF3FF", border: "#C7D8FF" },
  },
  {
    key: "physicalInfra",
    specificationName: "Infra Física",
    icon: LuServer,
    requiresCoverage: true,
    tone: { fg: "#8B5CF6", bg: "#F3EEFF", border: "#D3BFFD" },
  },
  {
    key: "hardware",
    specificationName: "Hardware / CPE",
    icon: LuRouter,
    requiresCoverage: false,
    tone: { fg: "#10B981", bg: "#EDFBF5", border: "#AAECD5" },
  },
  {
    key: "numberingResources",
    specificationName: "Recursos Numéricos",
    icon: LuHash,
    requiresCoverage: false,
    asksRegion: true,
    tone: { fg: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  },
  {
    key: "software",
    specificationName: "Softwares e Gerenciamento",
    icon: LuAppWindow,
    requiresCoverage: false,
    tone: { fg: "#E11D48", bg: "#FFF1F2", border: "#FECDD3" },
  },
  {
    key: "protocols",
    specificationName: "Protocolos e Serviços",
    icon: LuNetwork,
    requiresCoverage: false,
    tone: { fg: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" },
  },
];

/** Definição da categoria; vazio ou desconhecido devolve `undefined`. */
export function offerCategory(
  key: OfferCategory | "" | null | undefined,
): OfferCategoryDefinition | undefined {
  return OFFER_CATEGORIES.find((category) => category.key === key);
}
