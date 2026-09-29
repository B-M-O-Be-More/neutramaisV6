"use client";

import { Stack } from "@chakra-ui/react";
import React from "react";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import SearchNetworkCatalog from "@/components/SearchNetworkCatalog";
import SearchNetworkHero from "@/components/SearchNetworkHero";
import { SearchNetworkHeroStats } from "@/components/SearchNetworkHero/interface";
import SearchNetworkPromotions from "@/components/SearchNetworkPromotions";
import { SearchNetworkPromotion } from "@/components/SearchNetworkPromotions/interface";
import SearchNetworkTabs from "@/components/SearchNetworkTabs";
import { SearchNetworkTab } from "@/components/SearchNetworkTabs/interface";
import { PLACEHOLDER_BADGES } from "@/data/sessionPlaceholder";

// Valores do design, usados até existirem os endpoints de cobertura, métricas
// da plataforma e campanhas. Ao ligar a API, troque por hooks (src/hooks) que
// devolvam estes mesmos formatos.
const PLACEHOLDER_DETECTED_NETWORKS = 3;

const PLACEHOLDER_STATS: SearchNetworkHeroStats = {
  verifiedSellers: "2.418",
  averageSla: "99,5%",
  categories: "4 MVP",
  nearbyNetworks: "3",
};

const PLACEHOLDER_PROMOTIONS: SearchNetworkPromotion[] = [
  {
    id: "promo-1",
    emoji: "🔥",
    badge: "Promoção Semana",
    title: "Fibra 1Gbps -30% OFF",
    description: "Russas Telecom · válido até 14/07",
    href: "/offers",
    tone: "blue",
  },
  {
    id: "promo-2",
    emoji: "⚡",
    badge: "Nova oferta",
    title: "Link Dedicado 200 Mbps",
    description: "Lemmos Telecom · Primeira contratação com setup grátis",
    href: "/offers",
    tone: "violet",
  },
  {
    id: "promo-3",
    emoji: "🏆",
    badge: "Destaque regional",
    title: "Top 3 provedores em CE",
    description: "Score 4.8+ · Ativação em 24h garantida",
    href: "/offers",
    tone: "emerald",
  },
  {
    id: "promo-4",
    emoji: "🏆",
    badge: "Melhores Ofertas",
    title: "Uma Lista de ofertas para você",
    description: "Ofertas expiram em 3horas! Não perca.",
    href: "/offers",
    tone: "amber",
  },
];

// Busca de redes: banner com o campo de busca, alternância entre redes
// próximas e disponíveis, a faixa de campanhas e o catálogo (filtros +
// ofertas).
export default function SearchNetworkPage() {
  // `query` acompanha a digitação; `submittedQuery` só muda ao buscar — é ela
  // que filtra o catálogo, para a lista não piscar a cada tecla.
  const [query, setQuery] = React.useState("");
  const [submittedQuery, setSubmittedQuery] = React.useState("");
  const [tab, setTab] = React.useState<SearchNetworkTab>("nearby");

  const handleViewAll = () => {
    setQuery("");
    setSubmittedQuery("");
  };

  return (
    <AuthenticatedLayout badges={PLACEHOLDER_BADGES}>
      <Stack
        maxW="1280px"
        px={{ base: 4, md: "32px" }}
        py={{ base: 6, md: "32px" }}
        gap="20px"
      >
        <SearchNetworkHero
          detectedNetworks={PLACEHOLDER_DETECTED_NETWORKS}
          stats={PLACEHOLDER_STATS}
          query={query}
          onQueryChange={setQuery}
          onSearch={setSubmittedQuery}
        />
        <SearchNetworkTabs value={tab} onChange={setTab} />
        <SearchNetworkPromotions promotions={PLACEHOLDER_PROMOTIONS} />
        <SearchNetworkCatalog
          tab={tab}
          query={submittedQuery}
          onViewAll={handleViewAll}
        />
      </Stack>
    </AuthenticatedLayout>
  );
}
