"use client";

import { Flex, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  LuArrowRight,
  LuHardDrive,
  LuHash,
  LuServer,
  LuWifi,
} from "react-icons/lu";

import MarketplaceCategoryCard from "@/components/MarketplaceCategoryCard";
import { MarketplaceCategoryTone } from "@/components/MarketplaceCategoryCard/interface";

import {
  MarketplaceCategoriesProps,
  MarketplaceCategoryKey,
} from "./interface";

// Categorias do MVP, na ordem do design. Ícone, paleta e destino ficam aqui;
// os textos vêm do i18n (Marketplace.categories.items.<key>) e só a contagem
// depende da API.
const CATEGORIES: {
  key: MarketplaceCategoryKey;
  icon: typeof LuWifi;
  tone: MarketplaceCategoryTone;
}[] = [
  { key: "connectivity", icon: LuWifi, tone: "blue" },
  { key: "infrastructure", icon: LuServer, tone: "violet" },
  { key: "hardware", icon: LuHardDrive, tone: "emerald" },
  { key: "numbering", icon: LuHash, tone: "amber" },
];

/**
 * Seção "Explore por categoria" da home do marketplace.
 * Cabeçalho com o atalho para o catálogo completo e a grade de categorias,
 * todas renderizadas pelo mesmo MarketplaceCategoryCard.
 */
export function MarketplaceCategories({
  counts,
  isLoading,
}: MarketplaceCategoriesProps) {
  const { t } = useTranslation();
  const loading = isLoading ?? !counts;

  return (
    // O `pt` reproduz o respiro maior que o design dá antes desta seção — as
    // faixas anteriores usam só o gap padrão do container da página.
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
            {t("Marketplace.categories.title")}
          </Text>
          <Text pt="4px" fontSize="13px" lineHeight="19.5px" color="#8A9AB5">
            {t("Marketplace.categories.subtitle")}
          </Text>
        </Stack>

        <Link href="/marketplace">
          <Flex align="center" gap="6px" flexShrink={0}>
            <Text
              fontSize="13px"
              fontWeight={600}
              lineHeight="19.5px"
              color="#1F5AFF"
            >
              {t("Marketplace.categories.seeAll")}
            </Text>
            <Icon as={LuArrowRight} boxSize="14px" color="#1F5AFF" />
          </Flex>
        </Link>
      </Flex>

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="16px">
        {CATEGORIES.map((category) => {
          const base = `Marketplace.categories.items.${category.key}`;
          const tags = t(`${base}.tags`, { returnObjects: true });

          return (
            <MarketplaceCategoryCard
              key={category.key}
              icon={category.icon}
              tone={category.tone}
              href={`/marketplace?category=${category.key}`}
              title={t(`${base}.title`)}
              description={t(`${base}.description`)}
              badge={t(`${base}.badge`)}
              tags={Array.isArray(tags) ? (tags as string[]) : []}
              footerLabel={t(`${base}.footer`, {
                total: counts?.[category.key] ?? "",
              })}
              isLoading={loading}
            />
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
