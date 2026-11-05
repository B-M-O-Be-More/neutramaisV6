"use client";

import { Button, Flex, Icon, Skeleton, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuFlame, LuRefreshCw } from "react-icons/lu";

import OffersRow from "@/components/OffersRow";
import TrendingProductCard from "@/components/TrendingProductCard";
import { TRENDING_FILTERS, trendingCategory } from "@/functions/offers";
import { useProductOfferings } from "@/hooks/useProductOfferings";

import { TrendingProductsProps } from "./interface";

const PAGE_SIZE = 20;

/**
 * "Produtos em alta na Neutra+" (Figma 2772-34200): ofertas públicas do
 * catálogo, as patrocinadas primeiro, filtradas pelas abas de categoria. A
 * API ainda não traz contratações por período: a ordem é a do catálogo.
 */
export function TrendingProducts({
  filter,
  onFilterChange,
  locale,
}: TrendingProductsProps) {
  const { t } = useTranslation();
  const { offerings, isLoading, hasError, refetch } = useProductOfferings({
    pageSize: PAGE_SIZE,
  });

  const ranked = React.useMemo(
    () =>
      [...offerings]
        .sort((a, b) => Number(!!b.isPromoted) - Number(!!a.isPromoted))
        .map((offering, index) => ({
          offering,
          rank: index + 1,
          category: trendingCategory(offering),
        })),
    [offerings],
  );
  const visible =
    filter === "all"
      ? ranked
      : ranked.filter((item) => item.category === filter);

  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
  });

  let content: React.ReactNode;
  if (isLoading) {
    content = (
      <Flex gap="15px" overflow="hidden" aria-busy="true">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton
            key={index}
            w="237px"
            h="330px"
            flexShrink={0}
            rounded="16px"
          />
        ))}
      </Flex>
    );
  } else if (hasError || visible.length === 0) {
    content = (
      <Stack
        align="center"
        gap="10px"
        py="32px"
        bg="white"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="#E5E8EE"
        rounded="14px"
        textAlign="center"
      >
        <Text color="#5A6478" fontSize="13px" lineHeight="19.5px">
          {t(
            hasError
              ? "Offers.trending.error"
              : ranked.length === 0
                ? "Offers.trending.empty"
                : "Offers.trending.emptyFiltered",
          )}
        </Text>
        {hasError && (
          <Button
            variant="plain"
            h="32px"
            gap="6px"
            color="#1F5AFF"
            fontSize="13px"
            fontWeight={600}
            onClick={refetch}
          >
            <Icon as={LuRefreshCw} boxSize="13px" />
            {t("Offers.trending.retry")}
          </Button>
        )}
      </Stack>
    );
  } else {
    content = (
      <OffersRow label={t("Offers.trending.title")}>
        {visible.map(({ offering, rank, category }) => (
          <TrendingProductCard
            key={offering.id}
            rank={rank}
            title={offering.name}
            category={category}
            price={money.format(Number(offering.monthlyPrice))}
            priceSuffix={
              offering.productType === "physical"
                ? undefined
                : t("Marketplace.offers.perMonth")
            }
            sponsored={!!offering.isPromoted}
            addHref={`/cart?offeringId=${encodeURIComponent(offering.id)}`}
          />
        ))}
      </OffersRow>
    );
  }

  return (
    <Stack as="section" gap="20px" aria-labelledby="trending-products-title">
      <Flex
        direction={{ base: "column", lg: "row" }}
        align={{ base: "flex-start", lg: "flex-end" }}
        justify="space-between"
        gap="16px"
      >
        <Flex align="center" gap="12px">
          <Flex
            align="center"
            justify="center"
            boxSize="40px"
            flexShrink={0}
            bg="#FFF7ED"
            borderWidth="1px"
            borderColor="#FED7AA"
            rounded="12px"
          >
            <Icon as={LuFlame} boxSize="18px" color="#F97316" aria-hidden />
          </Flex>
          <Stack gap="0">
            <Text
              as="h2"
              id="trending-products-title"
              color="#0F1729"
              fontSize="20px"
              fontWeight={800}
              lineHeight="30px"
            >
              {t("Offers.trending.title")}
            </Text>
            <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
              {t("Offers.trending.subtitle")}
            </Text>
          </Stack>
        </Flex>
        <Flex
          gap="8px"
          wrap="wrap"
          role="group"
          aria-label={t("Offers.trending.filtersLabel")}
        >
          {TRENDING_FILTERS.map((option) => {
            const isActive = option === filter;
            return (
              <Button
                key={option}
                h="40px"
                px="16px"
                rounded="full"
                bg={isActive ? "#1F5AFF" : "white"}
                borderWidth="1px"
                borderColor={isActive ? "#1F5AFF" : "#E5E8EE"}
                color={isActive ? "white" : "#0F1729"}
                fontSize="13px"
                fontWeight={600}
                _hover={{ bg: isActive ? "#1646CC" : "#F4F6F9" }}
                aria-pressed={isActive}
                onClick={() => onFilterChange(option)}
              >
                {t(`Offers.trending.filters.${option}`)}
              </Button>
            );
          })}
        </Flex>
      </Flex>
      {content}
    </Stack>
  );
}
