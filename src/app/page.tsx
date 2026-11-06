"use client";

import { Box, Stack } from "@chakra-ui/react";

import MarketplaceCatalog from "@/components/MarketplaceCatalog";
import MarketplaceCategories from "@/components/MarketplaceCategories";
import { MarketplaceCategoryCounts } from "@/components/MarketplaceCategories/interface";
import MarketplaceCreditBanner from "@/components/MarketplaceCreditBanner";
import MarketplaceCtaBanner from "@/components/MarketplaceCtaBanner";
import MarketplaceFooter from "@/components/MarketplaceFooter";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import MarketplaceHero from "@/components/MarketplaceHero";
import MarketplaceHowItWorks from "@/components/MarketplaceHowItWorks";
import MarketplaceNetworkCoverage from "@/components/MarketplaceNetworkCoverage";
import MarketplaceOffers from "@/components/MarketplaceOffers";
import MarketplacePromoStrip from "@/components/MarketplacePromoStrip";
import MarketplacePromotions from "@/components/MarketplacePromotions";
import MarketplacePublicPrices from "@/components/MarketplacePublicPrices";
import MarketplaceStats from "@/components/MarketplaceStats";
import { MarketplaceStatsData } from "@/components/MarketplaceStats/interface";
import MarketplaceVideoShowcase from "@/components/MarketplaceVideoShowcase";

// Valores do design, usados até existir o endpoint de métricas da plataforma.
// Ao ligar a API, troque por um hook (src/hooks) que devolva este mesmo formato
// e o `isLoading` — a faixa já exibe esqueleto enquanto os dados não chegam.
const PLACEHOLDER_STATS: MarketplaceStatsData = {
  transactedVolume: "R$ 142M",
  activeProviders: "2.418",
  slaCompliance: "98,2%",
  averageResponseTime: "2m 47s",
  assessment: "4,5/8",
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

      {/* Figma 1:1 (Neutra+ MP, nó 3300:58734): conteúdo de até 1498px,
          24px entre aviso, banner e métricas, 28px até a primeira seção da
          landing e 40px entre as seções. */}
      <Stack
        maxW="1546px"
        mx="auto"
        px={{ base: 4, md: "24px" }}
        pt={{ base: 6, md: "20px" }}
        pb="0"
        gap={{ base: 6, md: "28px" }}
      >
        <Stack gap={{ base: 6, md: "24px" }}>
          <MarketplaceHero />
          <MarketplaceStats data={PLACEHOLDER_STATS} />
        </Stack>
        <Stack gap={{ base: 6, md: "40px" }}>
          <MarketplaceCatalog />
          <MarketplaceNetworkCoverage />
          <MarketplaceCategories counts={PLACEHOLDER_CATEGORY_COUNTS} />
          <MarketplacePromoStrip />
          <MarketplaceCreditBanner />
          <MarketplaceVideoShowcase />
          <MarketplacePublicPrices />
          <MarketplaceOffers />
          <MarketplacePromotions />
          {/* No Figma, "Como funciona" e o banner final ficam a 20px. */}
          <Stack gap={{ base: 6, md: "20px" }}>
            <MarketplaceHowItWorks />
            <MarketplaceCtaBanner />
          </Stack>
        </Stack>
      </Stack>

      <MarketplaceFooter />
    </Box>
  );
}
