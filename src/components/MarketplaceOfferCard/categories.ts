import type { IconType } from "react-icons";
import { LuHardDrive, LuHash, LuServer, LuWifi } from "react-icons/lu";

import type { MarketplaceCategoryKey } from "@/components/MarketplaceCategories/interface";

// Capa por categoria: gradiente, ícone e cor de destaque. Mesmas cores e
// ícones da seção de categorias — compartilhado pelos cards de oferta da home
// pública e da busca de redes.
export const OFFER_CATEGORY_PALETTE: Record<
  MarketplaceCategoryKey,
  { gradient: string; accent: string; icon: IconType }
> = {
  connectivity: {
    gradient: "linear-gradient(164deg, #1F5AFF 0%, #4B7FFF 100%)",
    accent: "#1F5AFF",
    icon: LuWifi,
  },
  infrastructure: {
    gradient: "linear-gradient(164deg, #8B5CF6 0%, #A78BFA 100%)",
    accent: "#8B5CF6",
    icon: LuServer,
  },
  hardware: {
    gradient: "linear-gradient(164deg, #10B981 0%, #34D399 100%)",
    accent: "#10B981",
    icon: LuHardDrive,
  },
  numbering: {
    gradient: "linear-gradient(164deg, #F59E0B 0%, #FBBF24 100%)",
    accent: "#F59E0B",
    icon: LuHash,
  },
};
