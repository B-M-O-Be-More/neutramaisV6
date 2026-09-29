"use client";

import { Box, Stack } from "@chakra-ui/react";

import MarketplaceCategories from "@/components/MarketplaceCategories";
import { MarketplaceCategoryCounts } from "@/components/MarketplaceCategories/interface";
import MarketplaceCtaBanner from "@/components/MarketplaceCtaBanner";
import MarketplaceFooter from "@/components/MarketplaceFooter";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import MarketplaceHero from "@/components/MarketplaceHero";
import MarketplaceHowItWorks from "@/components/MarketplaceHowItWorks";
import MarketplaceOffers from "@/components/MarketplaceOffers";
import MarketplacePromotions from "@/components/MarketplacePromotions";
import MarketplaceStats from "@/components/MarketplaceStats";
import { MarketplaceStatsData } from "@/components/MarketplaceStats/interface";

// Valores do design, usados até existir o endpoint de métricas da plataforma.
// Ao ligar a API, troque por um hook (src/hooks) que devolva este mesmo formato
// e o `isLoading` — a faixa já exibe esqueleto enquanto os dados não chegam.
const PLACEHOLDER_STATS: MarketplaceStatsData = {
  transactedVolume: "R$ 142M",
  activeProviders: "2.418",
  slaCompliance: "98,2%",
  averageResponseTime: "2m 47s",
};

// Contagens do design, no mesmo lugar e pelo mesmo motivo das métricas acima.
const PLACEHOLDER_CATEGORY_COUNTS: MarketplaceCategoryCounts = {
  connectivity: "1.243",
  infrastructure: "487",
  hardware: "892",
  numbering: "156",
};

// Home pública do marketplace — acessível sem autenticação.
// A tela é construída por partes; por ora traz o cabeçalho, o banner, as
// métricas da plataforma, as categorias, os preços públicos (promoções e
// vitrine de ofertas), o "como funciona"
// o banner de cadastro e o rodapé.
export default function Home() {
  return (
    <Box minH="100dvh" bg="white">
      <MarketplaceHeader />

      <Stack
        maxW="1216px"
        mx="auto"
        px={{ base: 4, md: "24px" }}
        py={{ base: 6, md: "32px" }}
        gap={{ base: 6, md: "24px" }}
      >
        <MarketplaceHero />
        <MarketplaceStats data={PLACEHOLDER_STATS} />
        <MarketplaceCategories counts={PLACEHOLDER_CATEGORY_COUNTS} />
        <MarketplacePromotions />
        <MarketplaceOffers />
        <MarketplaceHowItWorks />
        <MarketplaceCtaBanner />
        <MarketplaceFooter />
      </Stack>
    </Box>
  );
}
