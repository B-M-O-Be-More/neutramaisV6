"use client";

import { Flex, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuFlame, LuGift, LuSparkles } from "react-icons/lu";

import MarketplacePromoCard from "@/components/MarketplacePromoCard";
import { MarketplacePromoTone } from "@/components/MarketplacePromoCard/interface";

import {
  MarketplacePromotionKey,
  MarketplacePromotionsProps,
} from "./interface";

// Campanhas do design, na ordem exibida. Ícone, paleta e destino ficam aqui;
// os textos vêm do i18n (Marketplace.promotions.items.<key>). Quando houver
// endpoint de campanhas, esta lista passa a vir da API no mesmo formato.
const PROMOTIONS: {
  key: MarketplacePromotionKey;
  icon: typeof LuFlame;
  tone: MarketplacePromoTone;
  href: string;
}[] = [
  {
    key: "flashSale",
    icon: LuFlame,
    tone: "blue",
    href: "/marketplace?category=connectivity",
  },
  {
    key: "news",
    icon: LuSparkles,
    tone: "violet",
    href: "/marketplace?category=numbering",
  },
  { key: "highlight", icon: LuGift, tone: "emerald", href: "/marketplace" },
];

/**
 * Seção "Preços públicos" da home do marketplace.
 * Cabeçalho com o atalho para todas as ofertas e a faixa de campanhas em
 * destaque, todas renderizadas pelo mesmo MarketplacePromoCard.
 */
export function MarketplacePromotions({
  seeAllHref = "/marketplace",
}: MarketplacePromotionsProps) {
  const { t } = useTranslation();

  return (
    // Mesmo respiro extra antes da seção usado em MarketplaceCategories.
    <Stack gap="20px" pt={{ base: "20px", md: "44px" }}>
      <Flex
        align={{ base: "flex-start", md: "flex-end" }}
        justify="space-between"
        gap="12px"
        direction={{ base: "column", md: "row" }}
      >
        <Stack gap={0}>
          <Text
            as="h2"
            fontSize="20px"
            fontWeight={700}
            lineHeight="30px"
            color="#0F1729"
          >
            {t("Marketplace.promotions.title")}
          </Text>
          <Text pt="4px" fontSize="13px" lineHeight="19.5px" color="#8A9AB5">
            {t("Marketplace.promotions.subtitle")}
          </Text>
        </Stack>

        <Link href={seeAllHref}>
          <Flex align="center" gap="6px" flexShrink={0}>
            <Text
              fontSize="13px"
              fontWeight={600}
              lineHeight="19.5px"
              color="#1F5AFF"
            >
              {t("Marketplace.promotions.seeAll")}
            </Text>
            <Icon as={LuArrowRight} boxSize="14px" color="#1F5AFF" />
          </Flex>
        </Link>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap="16px">
        {PROMOTIONS.map((promotion) => {
          const base = `Marketplace.promotions.items.${promotion.key}`;

          return (
            <MarketplacePromoCard
              key={promotion.key}
              icon={promotion.icon}
              tone={promotion.tone}
              href={promotion.href}
              badge={t(`${base}.badge`)}
              title={t(`${base}.title`)}
              description={t(`${base}.description`)}
              ctaLabel={t(`${base}.cta`)}
            />
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
