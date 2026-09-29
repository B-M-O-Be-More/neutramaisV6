"use client";

import { Grid, Stack } from "@chakra-ui/react";

import DashboardFeaturedOffers from "@/components/DashboardFeaturedOffers";
import { DashboardFeaturedOffer } from "@/components/DashboardFeaturedOffers/interface";
import DashboardHero from "@/components/DashboardHero";
import { DashboardHeroData } from "@/components/DashboardHero/interface";
import DashboardQuickAccess from "@/components/DashboardQuickAccess";
import DashboardRecentActivity from "@/components/DashboardRecentActivity";
import { DashboardActivity } from "@/components/DashboardRecentActivity/interface";
import DashboardSellerPerformance from "@/components/DashboardSellerPerformance";
import { DashboardSellerPerformanceData } from "@/components/DashboardSellerPerformance/interface";
import DashboardStats from "@/components/DashboardStats";
import { DashboardStatsData } from "@/components/DashboardStats/interface";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import { useSession } from "@/contexts/SessionContext";
import { PLACEHOLDER_BADGES } from "@/data/sessionPlaceholder";

// Valores do design, usados até existirem os endpoints dos indicadores. Ao
// ligar a API, troque por hooks (src/hooks) que devolvam estes mesmos formatos.
// O nome do usuário já vem da sessão.

const PLACEHOLDER_HERO: Omit<DashboardHeroData, "firstName"> = {
  pendingActions: 3,
  criticalSlas: 1,
  awaitingProposals: 3,
  activeOrders: "3",
  openRfqs: "5",
  credit: "R$ 24k",
  sellerScore: "4.8",
};

const PLACEHOLDER_STATS: DashboardStatsData = {
  activeOrders: "300",
  ordersInProgress: 2,
  openRfqs: "5",
  rfqsWithProposal: 2,
  availableCredit: "R$ 204.744",
  activeContracts: "2",
  renewingContracts: 1,
  nextRenewalDays: 6,
};

// A busca pública do catálogo (useProductOfferings) ainda não traz provedor,
// SLA nem selos — por isso as ofertas em destaque também são fixas por ora.
const PLACEHOLDER_OFFERS: DashboardFeaturedOffer[] = [
  {
    id: "offer-1",
    title: "Fibra 1 Gbps",
    tag: { label: "🔥 Promoção", tone: "brand" },
    provider: "Russas Telecom",
    category: "Conectividade",
    sla: "99,5%",
    price: "R$ 99,90",
    isMonthly: true,
    href: "/offers",
  },
  {
    id: "offer-2",
    title: "Link Dedicado 200 Mbps",
    tag: { label: "Setup Grátis", tone: "success" },
    provider: "Lemmos Telecom",
    category: "Conectividade",
    sla: "99,9%",
    price: "R$ 2.890,00",
    isMonthly: true,
    href: "/offers",
  },
  {
    id: "offer-3",
    title: "ONT Gpon WiFi 6 ×5",
    tag: { label: "Estoque: 23", tone: "seller" },
    provider: "BRX Telecom",
    category: "Hardware",
    price: "R$ 24.500,00",
    href: "/offers",
  },
];

const PLACEHOLDER_ACTIVITIES: DashboardActivity[] = [
  {
    id: "act-1",
    tone: "success",
    message: "Pedido ORD-2026-102 aceito — Russas Telecom",
    timeAgo: "2 min atrás",
  },
  {
    id: "act-2",
    tone: "warning",
    message: "RFQ-2026-EXT-041 aguarda proposta · SLA: 18h",
    timeAgo: "1h atrás",
  },
  {
    id: "act-3",
    tone: "danger",
    message: "Disputa DIS-2026-011 crítica em revisão · SLA: 3h",
    timeAgo: "2h atrás",
  },
  {
    id: "act-4",
    tone: "message",
    message: "3 propostas recebidas para RFQ-2026-EXT-041",
    timeAgo: "3h atrás",
  },
  {
    id: "act-5",
    tone: "info",
    message: "OS-2026-0021 concluída — aceite técnico registrado",
    timeAgo: "2d atrás",
  },
];

const PLACEHOLDER_SELLER_PERFORMANCE: DashboardSellerPerformanceData = {
  rating: 4.8,
  reviewCount: 124,
  acceptanceSla: 95,
  onTimeDelivery: 88,
};

// Roda dentro do AuthenticatedLayout — a sessão já está carregada aqui.
function DashboardContent() {
  const { profile, personas } = useSession();
  const firstName = profile?.display_name.trim().split(/\s+/)[0] ?? "";

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "32px" }}
      gap="24px"
    >
      <DashboardHero data={{ ...PLACEHOLDER_HERO, firstName }} />
      <DashboardStats data={PLACEHOLDER_STATS} />

      <Grid
        templateColumns={{ base: "1fr", xl: "minmax(0, 1fr) 392px" }}
        gap="20px"
        alignItems="start"
      >
        <Stack gap="24px" minW={0}>
          <DashboardQuickAccess
            pendingProposals={PLACEHOLDER_BADGES.proposals}
            walletCredit="R$ 24.744"
          />
          <DashboardFeaturedOffers
            offers={PLACEHOLDER_OFFERS}
            viewAllHref="/offers"
          />
        </Stack>

        <Stack gap="20px" minW={0}>
          <DashboardRecentActivity activities={PLACEHOLDER_ACTIVITIES} />
          {/* Reputação só faz sentido para quem vende. */}
          {personas.includes("seller") && (
            <DashboardSellerPerformance
              data={PLACEHOLDER_SELLER_PERFORMANCE}
              reportHref="/seller/score"
            />
          )}
        </Stack>
      </Grid>
    </Stack>
  );
}

// Início da área autenticada: banner de boas-vindas e indicadores no topo;
// abaixo, acesso rápido e ofertas à esquerda, atividade e performance do
// seller à direita.
export default function DashboardPage() {
  return (
    <AuthenticatedLayout badges={PLACEHOLDER_BADGES}>
      <DashboardContent />
    </AuthenticatedLayout>
  );
}
