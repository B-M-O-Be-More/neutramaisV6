"use client";

import { Flex, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import ContractDetailPanel from "@/components/ContractDetailPanel";
import { contractDate, orderTotal, shortId } from "@/functions/contractFormat";

import { ContractSummaryProps } from "./interface";

/** "Dados do contrato" da coluna lateral do detalhe. */
export function ContractSummary({ entry, locale }: ContractSummaryProps) {
  const { t } = useTranslation();
  const { contract, order } = entry;
  const date = contractDate(entry);
  const total = order ? orderTotal(order, locale) : null;

  const rows: { key: string; value: string }[] = [
    { key: "contract", value: shortId(contract.contractId) },
    { key: "order", value: shortId(contract.orderId) },
    {
      key: "createdAt",
      value: date ? new Intl.DateTimeFormat(locale).format(date) : "—",
    },
    {
      key: "total",
      value: total
        ? `${total.value}${total.monthly ? t("Contracts.card.perMonth") : ""}`
        : "—",
    },
    {
      key: "policy",
      value: t(
        contract.policy === "buyer-only-v1"
          ? "Contracts.summary.policies.buyerOnly"
          : "Contracts.summary.policies.other",
        { policy: contract.policy },
      ),
    },
    {
      key: "documentVersion",
      value: String(contract.documentVersion),
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
