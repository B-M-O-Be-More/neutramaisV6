"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import ProposalTag from "@/components/ProposalTag";
import { offerCategory } from "@/data/offerCategories";

import { RfqReviewSummaryProps } from "./interface";

const LABEL_STYLES = {
  color: "#A0ABB8",
  fontSize: "9px",
  fontWeight: 700,
  lineHeight: "13.5px",
  letterSpacing: "0.45px",
  textTransform: "uppercase",
} as const;

/**
 * Resumo da RFQ antes do envio (Figma 2042-23286): categoria, urgência,
 * produto, detalhes informados, destinatários e o ID.
 */
export function RfqReviewSummary({ draft, rfqId }: RfqReviewSummaryProps) {
  const { t } = useTranslation();
  const category = offerCategory(draft.category);

  const rows = [
    { key: "description", value: draft.description },
    { key: "location", value: draft.location },
    {
      key: "budget",
      value: draft.budget || t("Proposals.rfq.create.summary.notInformed"),
    },
    {
      key: "deadline",
      value: t(
        draft.urgent
          ? "Proposals.rfq.create.summary.deadlineUrgent"
          : "Proposals.rfq.create.summary.deadlineValue",
        { count: draft.responseHours },
      ),
    },
    {
      key: "requirements",
      value: draft.requirements || t("Proposals.rfq.create.summary.none"),
    },
  ];

  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
      overflow="hidden"
    >
      <Stack
        gap="4px"
        px="20px"
        pt="16px"
        pb="17px"
        bg={category?.tone.bg}
        borderBottomWidth="1px"
        borderColor={category?.tone.border}
      >
        <Flex align="center" gap="8px">
          {category && (
            <Icon
              as={category.icon}
              boxSize="20px"
              color={category.tone.fg}
              aria-hidden
            />
          )}
          <Text
            flex="1"
            color={category?.tone.fg}
            fontSize="14px"
            fontWeight={700}
            lineHeight="21px"
          >
            {t(`SellerOfferCreate.categories.${draft.category}.label`)}
          </Text>
          {draft.urgent && (
            <ProposalTag
              tone="red"
              size="md"
              label={t("Proposals.rfq.create.summary.urgent")}
            />
          )}
        </Flex>
        <Text
          color="#0F1729"
          fontSize="16px"
          fontWeight={600}
          lineHeight="24px"
          overflowWrap="anywhere"
        >
          {draft.productName}
        </Text>
      </Stack>

      <Box as="dl">
        {rows.map((row) => (
          <Stack
            key={row.key}
            gap="4px"
            px="20px"
            pt="14px"
            pb="15px"
            borderBottomWidth="1px"
            borderColor="#F4F6F9"
          >
            <Text as="dt" {...LABEL_STYLES}>
              {t(`Proposals.rfq.create.summary.${row.key}`)}
            </Text>
            <Text
              as="dd"
              color="#0F1729"
              fontSize="13px"
              lineHeight="19.5px"
              whiteSpace="pre-line"
              overflowWrap="anywhere"
            >
              {row.value}
            </Text>
          </Stack>
        ))}
      </Box>

      <Flex
        justify="space-between"
        align="center"
        gap="12px"
        px="20px"
        py="16px"
        bg="#F8F9FB"
      >
        <Stack gap={0}>
          <Text {...LABEL_STYLES}>
            {t("Proposals.rfq.create.summary.recipients")}
          </Text>
          <Text
            color="#1F5AFF"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
          >
            {t("Proposals.rfq.create.summary.allSellers")}
          </Text>
        </Stack>
        <Stack gap={0} align="flex-end">
          <Text {...LABEL_STYLES}>{t("Proposals.rfq.create.summary.id")}</Text>
          <Text
            color="#8A9AB5"
            fontFamily="mono"
            fontSize="12px"
            lineHeight="18px"
          >
            {rfqId}
          </Text>
        </Stack>
      </Flex>
    </Box>
  );
}
