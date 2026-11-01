"use client";

import { SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { formatProposalMoney } from "@/functions/proposalFormat";

import { ReturnRequestSummaryProps } from "./interface";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap="4px" p="12px" bg="#F8F9FB" rounded="8px" minW={0}>
      <Text
        color="#A0ABB8"
        fontSize="9px"
        fontWeight={700}
        lineHeight="13.5px"
        textTransform="uppercase"
      >
        {label}
      </Text>
      <Text
        truncate
        color="#0F1729"
        fontSize="12px"
        fontWeight={600}
        lineHeight="18px"
      >
        {value}
      </Text>
    </Stack>
  );
}

/** "Solicitação do buyer": partes, motivo, valor e relato (Figma 2943-31528). */
export function ReturnRequestSummary({
  item,
  locale,
}: ReturnRequestSummaryProps) {
  const { t } = useTranslation();

  return (
    <Stack
      as="section"
      gap="16px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="12px"
    >
      <Text
        as="h2"
        color="#0F1729"
        fontSize="13px"
        fontWeight={700}
        lineHeight="19.5px"
      >
        {t("Returns.detail.request")}
      </Text>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap="12px">
        <Field label={t("Returns.detail.buyer")} value={item.buyerName} />
        <Field label={t("Returns.detail.seller")} value={item.sellerName} />
        <Field
          label={t("Returns.detail.reason")}
          value={t(`Returns.reasons.${item.reason}`)}
        />
        <Field
          label={t("Returns.detail.amount")}
          value={formatProposalMoney(item.amount, locale)}
        />
      </SimpleGrid>
      <Text color="#5A6478" fontSize="12px" lineHeight="20px">
        {item.description}
      </Text>
    </Stack>
  );
}
