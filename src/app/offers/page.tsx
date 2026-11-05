"use client";

import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuTag } from "react-icons/lu";

import CollapsibleNotice from "@/components/CollapsibleNotice";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import OfferCampaignCard from "@/components/OfferCampaignCard";
import OfferForYouCard from "@/components/OfferForYouCard";
import OffersHero from "@/components/OffersHero";
import OffersRow from "@/components/OffersRow";
import OfferTopProvidersCard from "@/components/OfferTopProvidersCard";
import TrendingProducts from "@/components/TrendingProducts";
import { PLACEHOLDER_BADGES } from "@/data/sessionPlaceholder";
import { currencyLocale } from "@/functions/currencyLocale";
import type { TrendingFilter } from "@/functions/offers";
import { useOffersShowcase } from "@/hooks/useOffersShowcase";

// "Ver Oferta" leva ao catálogo do Buscar Rede, onde as ofertas reais podem
// ser comparadas, adicionadas ao carrinho ou negociadas.
const CATALOG_HREF = "/search-network";

function OffersContent() {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);
  const { showcase, now } = useOffersShowcase();
  const [showNotice, setShowNotice] = React.useState(true);
  const [trendingFilter, setTrendingFilter] =
    React.useState<TrendingFilter>("all");
  const trendingRef = React.useRef<HTMLDivElement>(null);

  const campaignCard = (offer: (typeof showcase.specials)[number]) => (
    <Box key={offer.id} w="319px">
      <OfferCampaignCard offer={offer} now={now} href={CATALOG_HREF} />
    </Box>
  );

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="20px"
    >
      {showNotice && (
        <CollapsibleNotice
          tone="blue"
          icon={LuTag}
          title={t("Offers.notice.title")}
          description={t("Offers.notice.description")}
          labels={{
            collapse: t("Offers.notice.collapse"),
            expand: t("Offers.notice.expand"),
            dismiss: t("Offers.notice.dismiss"),
          }}
          onDismiss={() => setShowNotice(false)}
        />
      )}

      <OffersHero
        onSelectCategory={(category) => {
          setTrendingFilter(category);
          trendingRef.current?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <Stack gap="16px">
        <Flex
          align={{ base: "flex-start", sm: "center" }}
          justify="space-between"
          direction={{ base: "column", sm: "row" }}
          gap="8px"
        >
          <Stack gap="0">
            <Text
              as="h2"
              color="#0F1729"
              fontSize="20px"
              fontWeight={700}
              lineHeight="30px"
            >
              {t("Offers.specials.title")}
            </Text>
            <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
              {t("Offers.specials.subtitle")}
            </Text>
          </Stack>
          <Flex align="center" gap="12px">
            <Text color="#A0ABB8" fontSize="13px" lineHeight="19.5px">
              {t("Offers.specials.count", { count: showcase.specials.length })}
            </Text>
            <Button
              asChild
              variant="plain"
              h="auto"
              p={0}
              color="#1F5AFF"
              fontSize="13px"
              fontWeight={600}
              lineHeight="19.5px"
            >
              <NextLink href={CATALOG_HREF}>
                {t("Offers.specials.viewAll")}
              </NextLink>
            </Button>
          </Flex>
        </Flex>
        <OffersRow label={t("Offers.specials.title")}>
          <Box w="280px">
            <OfferTopProvidersCard
              providers={showcase.topProviders.providers}
            />
          </Box>
          {showcase.specials.map(campaignCard)}
        </OffersRow>
      </Stack>

      <Box ref={trendingRef} scrollMarginTop="80px">
        <TrendingProducts
          filter={trendingFilter}
          onFilterChange={setTrendingFilter}
          locale={locale}
        />
      </Box>

      <OffersRow label={t("Offers.featuredLabel")} tone="dark">
        {showcase.featured.map(campaignCard)}
      </OffersRow>

      <OffersRow label={t("Offers.bestDealsLabel")}>
        <Box w="273px">
          <OfferForYouCard items={showcase.forYou} href={CATALOG_HREF} />
        </Box>
        {showcase.bestDeals.map(campaignCard)}
      </OffersRow>
    </Stack>
  );
}

// Página de ofertas (Figma 2084-13767): campanhas, Top 3 provedores, produtos
// em alta do catálogo e listas personalizadas. As campanhas ainda vêm dos
// dados do design (useOffersShowcase); "Produtos em alta" usa a busca pública
// do catálogo.
export default function OffersPage() {
  return (
    <AuthenticatedLayout badges={PLACEHOLDER_BADGES}>
      <OffersContent />
    </AuthenticatedLayout>
  );
}
