"use client";

import { SimpleGrid } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import MarketplaceStatCard from "@/components/MarketplaceStatCard";

import { MarketplaceStatsProps } from "./interface";

// Métricas da faixa, na ordem do design. `key` casa com o campo de
// MarketplaceStatsData e com as chaves de i18n (Marketplace.stats.<key>).
const METRICS = [
  { key: "transactedVolume", accentColor: "#1F5AFF" },
  { key: "activeProviders", accentColor: "#8B5CF6" },
  { key: "averageResponseTime", accentColor: "#F59E0B" },
] as const;

/**
 * Faixa de métricas exibida abaixo do banner da home do marketplace.
 * Reaproveita o MarketplaceStatCard para as quatro métricas; rótulo e legenda
 * vêm do i18n e só os valores dependem da API.
 */
export function MarketplaceStats({ data, isLoading }: MarketplaceStatsProps) {
  const { t } = useTranslation();
  const loading = isLoading ?? !data;

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="16px">
      {METRICS.map((metric) => (
        <MarketplaceStatCard
          key={metric.key}
          label={t(`Marketplace.stats.${metric.key}.label`)}
          caption={t(`Marketplace.stats.${metric.key}.caption`)}
          value={data?.[metric.key] ?? ""}
          accentColor={metric.accentColor}
          isLoading={loading}
        />
      ))}
    </SimpleGrid>
  );
}
