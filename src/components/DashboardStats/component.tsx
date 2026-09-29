"use client";

import { SimpleGrid } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuActivity, LuFileText, LuPackage, LuWallet } from "react-icons/lu";

import DashboardStatCard from "@/components/DashboardStatCard";

import { DashboardStatsProps } from "./interface";

/** Faixa com os quatro indicadores principais da conta. */
export function DashboardStats({ data }: DashboardStatsProps) {
  const { t } = useTranslation();

  return (
    <SimpleGrid as="section" columns={{ base: 1, sm: 2, xl: 4 }} gap="16px">
      <DashboardStatCard
        icon={LuPackage}
        accentColor="#1F5AFF"
        label={t("Dashboard.stats.activeOrders")}
        value={data.activeOrders}
        caption={t("Dashboard.stats.ordersInProgress", {
          count: data.ordersInProgress,
        })}
      />
      <DashboardStatCard
        icon={LuFileText}
        accentColor="#8B5CF6"
        label={t("Dashboard.stats.openRfqs")}
        value={data.openRfqs}
        caption={t("Dashboard.stats.rfqsWithProposal", {
          count: data.rfqsWithProposal,
        })}
      />
      <DashboardStatCard
        icon={LuWallet}
        accentColor="#10B981"
        label={t("Dashboard.stats.credit")}
        value={data.availableCredit}
        caption={t("Dashboard.stats.available")}
      />
      <DashboardStatCard
        icon={LuActivity}
        accentColor="#D97706"
        label={t("Dashboard.stats.activeContracts")}
        value={data.activeContracts}
        caption={t("Dashboard.stats.renewingContracts", {
          count: data.renewingContracts,
          days: data.nextRenewalDays,
        })}
      />
    </SimpleGrid>
  );
}
