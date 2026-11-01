import {
  LuBox,
  LuCircleUser,
  LuFileText,
  LuInbox,
  LuMegaphone,
  LuMessageCircleQuestion,
  LuMessageSquare,
  LuPackageOpen,
  LuSearch,
  LuUserCheck,
  LuUserPlus,
  LuWallet,
  LuWrench,
} from "react-icons/lu";

import { SidebarNavGroup, SidebarPersona } from "./interface";

// Cores de destaque de cada papel: título, ponto, item ativo e contador
// (`badge`, quando difere do destaque).
export const PERSONA_COLORS: Record<
  SidebarPersona,
  { accent: string; subtle: string; badge?: string }
> = {
  buyer: { accent: "#1F5AFF", subtle: "#EEF3FF" },
  seller: { accent: "#8B5CF6", subtle: "#F3EEFF" },
  admin: { accent: "#D97706", subtle: "#FFFBEB", badge: "#F59E0B" },
};

// Estrutura da navegação da área autenticada (Figma 2035-5988), só com as
// páginas da primeira fase do sistema. Rotas técnicas em inglês; os textos vêm
// do i18n (AppSidebar.*).
export const SIDEBAR_NAVIGATION: SidebarNavGroup[] = [
  {
    persona: "admin",
    homeHref: "/admin",
    hideHeading: true,
    sections: [
      {
        key: "onboarding",
        // O painel /admin é a fila de KYC.
        items: [{ key: "kyc", href: "/admin", icon: LuUserCheck }],
      },
      {
        key: "platform",
        items: [
          {
            key: "platformInvites",
            href: "/admin/platform-invites",
            icon: LuUserPlus,
          },
        ],
      },
    ],
  },
  {
    persona: "buyer",
    homeHref: "/dashboard",
    sections: [
      {
        key: "marketplace",
        items: [
          { key: "searchNetwork", href: "/search-network", icon: LuSearch },
          { key: "myNetworks", href: "/my-networks", icon: LuBox },
        ],
      },
      {
        key: "management",
        items: [
          { key: "contracts", href: "/contracts", icon: LuFileText },
          { key: "returns", href: "/returns", icon: LuPackageOpen },
        ],
      },
      {
        key: "support",
        items: [{ key: "tickets", href: "/tickets", icon: LuMessageSquare }],
      },
      {
        key: "finance",
        items: [{ key: "wallet", href: "/wallet", icon: LuWallet }],
      },
      {
        key: "account",
        items: [{ key: "profile", href: "/profile", icon: LuCircleUser }],
      },
    ],
  },
  {
    persona: "seller",
    homeHref: "/dashboard",
    sections: [
      {
        key: "marketplace",
        items: [
          { key: "searchNetwork", href: "/search-network", icon: LuSearch },
        ],
      },
      {
        key: "catalog",
        items: [
          { key: "sellerOffers", href: "/seller/offers", icon: LuMegaphone },
        ],
      },
      {
        key: "sales",
        items: [
          { key: "receivedOrders", href: "/seller/orders", icon: LuInbox },
          {
            key: "serviceOrders",
            href: "/seller/service-orders",
            icon: LuWrench,
          },
          {
            key: "questions",
            href: "/seller/questions",
            icon: LuMessageCircleQuestion,
          },
        ],
      },
      {
        key: "sellerFinance",
        items: [{ key: "wallet", href: "/seller/wallet", icon: LuWallet }],
      },
      {
        key: "account",
        items: [{ key: "profile", href: "/profile", icon: LuCircleUser }],
      },
    ],
  },
];
