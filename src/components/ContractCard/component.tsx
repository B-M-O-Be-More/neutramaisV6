"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuDownload, LuFileText } from "react-icons/lu";

import ContractActionButton from "@/components/ContractActionButton";
import ContractSignButton from "@/components/ContractSignButton";
import ContractStatusBadge from "@/components/ContractStatusBadge";
import { CONTRACT_STATUS_STYLES } from "@/data/contractStatus";
import {
  contractDate,
  orderItemNames,
  orderTotal,
  shortId,
} from "@/functions/contractFormat";

import { ContractCardProps } from "./interface";

/**
 * Contrato de pedido do buyer: produto e valor do pedido, número do pedido e
 * do contrato, status da assinatura e as ações (assinar, baixar o PDF, ver o
 * detalhe).
 */
export function ContractCard({
  entry,
  locale,
  signAction,
  isSigning,
  isDownloading,
  canDownload,
  onSign,
  onDownload,
}: ContractCardProps) {
  const { t } = useTranslation();
  const { contract, order } = entry;
  const style = CONTRACT_STATUS_STYLES[contract.status];
  const titleId = `contract-${contract.contractId}-title`;
  const names = order ? orderItemNames(order) : [];
  const total = order ? orderTotal(order, locale) : null;
  const date = contractDate(entry);
  const title = names.length
    ? names.length > 1
      ? t("Contracts.card.more", { name: names[0], count: names.length - 1 })
      : names[0]
    : t("Contracts.card.untitled", { id: shortId(contract.orderId) });

  return (
    <Box
      as="article"
      id={`contract-${contract.contractId}`}
      aria-labelledby={titleId}
      bg="white"
      borderWidth="1px"
      borderColor={style.cardBorder}
      rounded="14px"
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        align="flex-start"
        gap="16px"
        p="20px"
      >
        <Flex flex="1" gap="16px" align="flex-start" minW={0} w="full">
          <Flex
            boxSize="40px"
            align="center"
            justify="center"
            flexShrink={0}
            bg="#EEF3FF"
            borderWidth="1px"
            borderColor="#C7D8FF"
            rounded="14px"
          >
            <Icon as={LuFileText} boxSize="16px" color="#1F5AFF" aria-hidden />
          </Flex>

          <Stack gap={0} flex="1" minW={0}>
            <Text
              as="h2"
              id={titleId}
              color="#0F1729"
              fontSize="14px"
              fontWeight={700}
              lineHeight="21px"
            >
              {title}
            </Text>

            <Text pt="2px" color="#8A9AB5" fontSize="12px" lineHeight="18px">
              {[
                t("Contracts.card.order", { id: shortId(contract.orderId) }),
                t("Contracts.card.contract", {
                  id: shortId(contract.contractId),
                }),
                date &&
                  t("Contracts.card.createdAt", {
                    date: new Intl.DateTimeFormat(locale).format(date),
                  }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>

            <Text pt="8px" color="#5A6478" fontSize="12px" lineHeight="18px">
              {t(`Contracts.statusDescriptions.${contract.status}`)}
            </Text>
          </Stack>
        </Flex>

        <Stack
          gap="8px"
          align={{ base: "flex-start", md: "flex-end" }}
          flexShrink={0}
          ps={{ base: "56px", md: 0 }}
        >
          <ContractStatusBadge status={contract.status} />
          {total && (
            <Text
              color="#0F1729"
              fontSize="16px"
              fontWeight={800}
              lineHeight="24px"
              whiteSpace="nowrap"
            >
              {total.value}
              {total.monthly && (
                <Text
                  as="span"
                  color="#A0ABB8"
                  fontSize="12px"
                  lineHeight="18px"
                >
                  {t("Contracts.card.perMonth")}
                </Text>
              )}
            </Text>
          )}
        </Stack>
      </Flex>

      <Flex
        gap="8px"
        wrap="wrap"
        align="center"
        px="20px"
        py="14px"
        borderTopWidth="1px"
        borderColor="#F4F6F9"
      >
        <ContractSignButton
          signAction={signAction}
          isSigning={isSigning}
          onSign={onSign}
        />
        <Box flex="1" display={{ base: "none", md: "block" }} />
        {canDownload && (
          <ContractActionButton
            tone="neutral"
            icon={LuDownload}
            loading={isDownloading}
            onClick={onDownload}
          >
            {t("Contracts.actions.downloadPdf")}
          </ContractActionButton>
        )}
        <ContractActionButton
          tone="neutral"
          icon={LuFileText}
          href={`/contracts/${encodeURIComponent(contract.contractId)}`}
        >
          {t("Contracts.actions.viewDetails")}
        </ContractActionButton>
      </Flex>
    </Box>
  );
}
