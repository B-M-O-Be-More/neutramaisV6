"use client";

import { Flex, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  LuChartNoAxesColumn,
  LuFileText,
  LuPackage,
  LuSearch,
  LuStore,
  LuWallet,
} from "react-icons/lu";

import DashboardQuickAccessCard from "@/components/DashboardQuickAccessCard";

import { DashboardQuickAccessProps } from "./interface";

/** Seção "Acesso rápido" com os atalhos coloridos para as áreas principais. */
export function DashboardQuickAccess({
  pendingProposals,
  walletCredit,
}: DashboardQuickAccessProps) {
  const { t } = useTranslation();

  return (
    <Stack as="section" gap="16px">
      <Flex align="center" justify="space-between">
        <Text
          as="h2"
          color="#0F1729"
          fontSize="16px"
          fontWeight={700}
          lineHeight="24px"
        >
          {t("Dashboard.quickAccess.title")}
        </Text>
      </Flex>

      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap="12px">
        <DashboardQuickAccessCard
          href="/search-network"
          icon={LuSearch}
          gradient={["#1F5AFF", "#4B7FFF"]}
          title={t("Dashboard.quickAccess.searchNetwork.title")}
          description={t("Dashboard.quickAccess.searchNetwork.description")}
        />
        <DashboardQuickAccessCard
          href="/proposals"
          icon={LuFileText}
          gradient={["#8B5CF6", "#A78BFA"]}
          count={pendingProposals}
          title={t("Dashboard.quickAccess.proposals.title")}
          description={t("Dashboard.quickAccess.proposals.description")}
        />
        <DashboardQuickAccessCard
          href="/orders"
          icon={LuPackage}
          gradient={["#10B981", "#34D399"]}
          title={t("Dashboard.quickAccess.orders.title")}
          description={t("Dashboard.quickAccess.orders.description")}
        />
        <DashboardQuickAccessCard
          href="/wallet"
          icon={LuWallet}
          gradient={["#F59E0B", "#FBBF24"]}
          title={t("Dashboard.quickAccess.wallet.title")}
          description={t("Dashboard.quickAccess.wallet.description", {
            value: walletCredit,
          })}
        />
        <DashboardQuickAccessCard
          href="/disputes"
          icon={LuStore}
          gradient={["#8B5CF6", "#C084FC"]}
          title={t("Dashboard.quickAccess.disputes.title")}
          description={t("Dashboard.quickAccess.disputes.description")}
        />
        <DashboardQuickAccessCard
          href="/payment-methods"
          icon={LuChartNoAxesColumn}
          gradient={["#5A6478", "#8A9AB5"]}
          title={t("Dashboard.quickAccess.finance.title")}
          description={t("Dashboard.quickAccess.finance.description")}
        />
      </SimpleGrid>
    </Stack>
  );
}
