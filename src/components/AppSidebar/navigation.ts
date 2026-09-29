import {
  LuActivity,
  LuBuilding2,
  LuChartNoAxesColumn,
  LuCircleAlert,
  LuClipboardList,
  LuCreditCard,
  LuDollarSign,
  LuFileText,
  LuHash,
  LuHouse,
  LuInbox,
  LuMegaphone,
  LuMessageSquare,
  LuPackage,
  LuSearch,
  LuServer,
  LuShoppingCart,
  LuTrendingUp,
  LuUsers,
  LuWallet,
  LuWrench,
} from "react-icons/lu";

import { SidebarNavGroup, SidebarPersona } from "./interface";

// Cores de destaque de cada papel: título, ponto, contador e item ativo.
export const PERSONA_COLORS: Record<
  SidebarPersona,
  { accent: string; subtle: string }
> = {
  buyer: { accent: "#1F5AFF", subtle: "#EEF3FF" },
  seller: { accent: "#8B5CF6", subtle: "#F3EEFF" },
};

// Estrutura da navegação da área autenticada, na ordem do design.
// Rotas técnicas em inglês; os textos vêm do i18n (AppSidebar.*).
export const SIDEBAR_NAVIGATION: SidebarNavGroup[] = [
  {
    persona: "buyer",
    sections: [
      {
        key: "marketplace",
        items: [
          { key: "home", href: "/dashboard", icon: LuHouse },
          { key: "searchNetwork", href: "/search-network", icon: LuSearch },
          { key: "proposals", href: "/proposals", icon: LuFileText },
          { key: "contracts", href: "/contracts", icon: LuPackage },
          { key: "offers", href: "/offers", icon: LuHash, iconSize: "12px" },
        ],
      },
      {
        key: "purchases",
        items: [
          { key: "orders", href: "/orders", icon: LuShoppingCart },
          {
            key: "serviceOrders",
            href: "/service-orders",
            icon: LuClipboardList,
          },
          {
            key: "disputes",
            href: "/disputes",
            icon: LuCircleAlert,
            badgeTone: "danger",
          },
          { key: "reports", href: "/reports", icon: LuChartNoAxesColumn },
        ],
      },
      {
        key: "support",
        items: [{ key: "tickets", href: "/tickets", icon: LuMessageSquare }],
      },
      {
        key: "finance",
        items: [
          { key: "wallet", href: "/wallet", icon: LuWallet },
          {
            key: "paymentMethods",
            href: "/payment-methods",
            icon: LuCreditCard,
          },
        ],
      },
    ],
  },
  {
    persona: "seller",
    sections: [
      {
        key: "catalog",
        items: [
          { key: "sellerOffers", href: "/seller/offers", icon: LuMegaphone },
          {
            key: "sponsoredOffers",
            href: "/seller/sponsored-offers",
            icon: LuTrendingUp,
          },
          { key: "coverage", href: "/seller/coverage", icon: LuServer },
        ],
      },
      {
        key: "sales",
        items: [
          { key: "receivedOrders", href: "/seller/orders", icon: LuInbox },
          { key: "receivedRfqs", href: "/seller/rfqs", icon: LuMessageSquare },
          {
            key: "sellerServiceOrders",
            href: "/seller/service-orders",
            icon: LuWrench,
          },
          {
            key: "sellerDisputes",
            href: "/seller/disputes",
            icon: LuCircleAlert,
            badgeTone: "danger",
          },
        ],
      },
      {
        key: "sellerFinance",
        items: [
          { key: "payouts", href: "/seller/payouts", icon: LuDollarSign },
          { key: "advances", href: "/seller/advances", icon: LuActivity },
          {
            key: "sellerReports",
            href: "/seller/reports",
            icon: LuChartNoAxesColumn,
          },
        ],
      },
      {
        key: "performance",
        items: [
          { key: "score", href: "/seller/score", icon: LuTrendingUp },
          {
            key: "sellerTickets",
            href: "/seller/tickets",
            icon: LuMessageSquare,
          },
          { key: "crm", href: "/seller/crm", icon: LuUsers },
        ],
      },
      {
        key: "settings",
        items: [
          { key: "team", href: "/settings/team", icon: LuUsers },
          { key: "company", href: "/settings/company", icon: LuBuilding2 },
        ],
      },
    ],
  },
];
