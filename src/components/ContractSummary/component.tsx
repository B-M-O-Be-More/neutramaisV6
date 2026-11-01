"use client";

import { Flex, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import ContractDetailPanel from "@/components/ContractDetailPanel";
import { formatAdjustment, formatPercent } from "@/functions/contractFormat";
import {
  formatProposalMoney,
  formatShortDate,
} from "@/functions/proposalFormat";

import { ContractSummaryProps } from "./interface";

/** "Dados do contrato" da coluna lateral do detalhe (Figma 2190-14321). */
export function ContractSummary({ contract, locale }: ContractSummaryProps) {
  const { t } = useTranslation();

  const rows: { key: string; value: string }[] = [
    { key: "startDate", value: formatShortDate(contract.startDate, locale) },
    {
      key: "nextBilling",
      value: contract.nextBillingDate
        ? formatShortDate(contract.nextBillingDate, locale)
        : "—",
    },
    { key: "renewsAt", value: formatShortDate(contract.renewsAt, locale) },
    {
      key: "price",
      value: `${formatProposalMoney(contract.price, locale)}${t(`Contracts.card.per.${contract.billingCycle}`)}`,
    },
    { key: "sla", value: formatPercent(contract.slaPercent, locale) },
    {
      key: "loyalty",
      value: t("Contracts.months", { count: contract.loyaltyMonths }),
    },
    {
      key: "exitFee",
      value: contract.exitFee
        ? formatProposalMoney(contract.exitFee, locale)
        : t("Contracts.details.noExitFee"),
    },
    {
      key: "adjustment",
      value: contract.adjustment
        ? formatAdjustment(contract.adjustment, locale)
        : "—",
    },
  ];

  return (
    <ContractDetailPanel title={t("Contracts.summary.title")} size="sm">
      <dl>
        {rows.map(({ key, value }, index) => (
          <Flex
            key={key}
            align="flex-start"
            justify="space-between"
            gap="12px"
            px="16px"
            py="12px"
            borderBottomWidth={index < rows.length - 1 ? "1px" : 0}
            borderColor="#F4F6F9"
            fontSize="11px"
            lineHeight="16.5px"
          >
            <Text as="dt" color="#A0ABB8">
              {t(`Contracts.summary.${key}`)}
            </Text>
            <Text as="dd" color="#0F1729" fontWeight={700} textAlign="right">
              {value}
            </Text>
          </Flex>
        ))}
      </dl>
    </ContractDetailPanel>
  );
}
