"use client";

import {
  Button,
  Checkbox,
  Flex,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuCircleCheck, LuClock, LuPlus } from "react-icons/lu";

import ProposalStatusBadge from "@/components/ProposalStatusBadge";
import { offerCategory } from "@/data/offerCategories";
import { RFQ_STATUS_STYLES } from "@/data/proposalStatus";
import {
  formatProposalMoney,
  formatShortDate,
  hoursUntil,
} from "@/functions/proposalFormat";
import { isRfqCancellable } from "@/hooks/useRfqs";

import { RfqCardProps } from "./interface";

// Botões da linha de ações do card (Figma 2038-19697).
const ACTION_BUTTON = {
  variant: "plain",
  h: "37.5px",
  px: "13px",
  gap: "8px",
  rounded: "10px",
  fontSize: "13px",
  lineHeight: "19.5px",
} as const;

const OUTLINE_BUTTON = {
  ...ACTION_BUTTON,
  borderWidth: "1px",
  borderColor: "#E5E8EE",
  color: "#5A6478",
  fontWeight: 500,
  _hover: { bg: "#F4F6F9" },
} as const;

const PRIMARY_BUTTON = {
  ...ACTION_BUTTON,
  px: "12px",
  bg: "#1F5AFF",
  color: "white",
  fontWeight: 700,
  _hover: { bg: "#1646CC" },
} as const;

/** Até 24h para o fim do prazo, o tempo restante fica vermelho. */
const URGENT_HOURS = 24;

/**
 * Card de uma RFQ (Figma 2038-19649): produto, status e prazo; sellers
 * notificados, propostas recebidas, criação e melhor proposta; e as ações
 * que o status permite.
 */
export function RfqCard({
  rfq,
  locale,
  now,
  selectable = false,
  selected = false,
  onSelectedChange,
  onAction,
}: RfqCardProps) {
  const { t } = useTranslation();
  const category = offerCategory(rfq.category);
  const isCancellable = isRfqCancellable(rfq.status);
  const hoursLeft = isCancellable ? hoursUntil(rfq.deadlineAt, now) : 0;

  const stats = [
    {
      key: "notifiedSellers",
      value: String(rfq.notifiedSellers),
      color: "#0F1729",
      size: "15px",
    },
    {
      key: "proposalsReceived",
      value: String(rfq.proposalsReceived),
      color: rfq.proposalsReceived ? "#1F5AFF" : "#8A9AB5",
      size: "15px",
    },
    {
      key: "createdAt",
      value: formatShortDate(rfq.createdAt, locale),
      color: "#5A6478",
      size: "14px",
      weight: 600,
    },
    {
      key: "bestProposal",
      value: rfq.bestProposal
        ? formatProposalMoney(rfq.bestProposal, locale)
        : "—",
      color: rfq.bestProposal ? "#10B981" : "#A0ABB8",
      size: "14px",
    },
  ];

  return (
    <Stack
      as="article"
      aria-label={`${rfq.productName} · ${rfq.id}`}
      gap="16px"
      p="21px"
      bg="white"
      borderWidth="1px"
      borderColor={selected ? "#8B5CF6" : "#E5E8EE"}
      rounded="14px"
    >
      <Flex
        gap="16px"
        justify="space-between"
        direction={{ base: "column", md: "row" }}
      >
        <Flex gap="12px" align="flex-start" minW={0}>
          {selectable && isCancellable && (
            <Checkbox.Root
              checked={selected}
              onCheckedChange={(details) =>
                onSelectedChange?.(details.checked === true)
              }
              mt="12px"
              colorPalette="purple"
            >
              <Checkbox.HiddenInput
                aria-label={t("Proposals.rfq.card.select", { id: rfq.id })}
              />
              <Checkbox.Control />
            </Checkbox.Root>
          )}
          <Flex
            align="center"
            justify="center"
            boxSize="40px"
            flexShrink={0}
            bg="#F4F6F9"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="14px"
          >
            {category && (
              <Icon
                as={category.icon}
                boxSize="13px"
                color={category.tone.fg}
                aria-hidden
              />
            )}
          </Flex>
          <Stack gap="4px" minW={0}>
            <Flex align="baseline" gap="8px" wrap="wrap">
              <Text
                as="h3"
                color="#0F1729"
                fontSize="15px"
                fontWeight={700}
                lineHeight="22.5px"
              >
                {rfq.productName}
              </Text>
              <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
                #{rfq.id}
              </Text>
            </Flex>
            <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
              {rfq.description}
            </Text>
          </Stack>
        </Flex>

        <Stack
          gap="8px"
          align={{ base: "flex-start", md: "flex-end" }}
          flexShrink={0}
        >
          <ProposalStatusBadge
            size="md"
            status={RFQ_STATUS_STYLES[rfq.status]}
            label={t(`Proposals.rfq.status.${rfq.status}`)}
          />
          {isCancellable && (
            <Flex
              align="center"
              gap="4px"
              color={hoursLeft <= URGENT_HOURS ? "#EF4444" : "#D97706"}
            >
              <Icon as={LuClock} boxSize="10px" aria-hidden />
              <Text fontSize="11px" lineHeight="16.5px">
                {t("Proposals.rfq.card.hoursLeft", { count: hoursLeft })}
              </Text>
            </Flex>
          )}
        </Stack>
      </Flex>

      <SimpleGrid
        as="dl"
        columns={{ base: 2, md: 4 }}
        gap="12px"
        pt="13px"
        borderTopWidth="1px"
        borderColor="#F4F6F9"
      >
        {stats.map((stat) => (
          <Stack key={stat.key} gap="4px" minW={0}>
            <Text
              as="dt"
              color="#A0ABB8"
              fontSize="9px"
              fontWeight={700}
              lineHeight="13.5px"
              letterSpacing="0.45px"
              textTransform="uppercase"
            >
              {t(`Proposals.rfq.card.${stat.key}`)}
            </Text>
            <Text
              as="dd"
              color={stat.color}
              fontSize={stat.size}
              fontWeight={stat.weight ?? 700}
              lineHeight={stat.size === "15px" ? "22.5px" : "21px"}
            >
              {stat.value}
            </Text>
          </Stack>
        ))}
      </SimpleGrid>

      <Flex gap="8px" wrap="wrap">
        {rfq.status === "proposalReceived" && (
          <>
            <Button
              {...PRIMARY_BUTTON}
              onClick={() => onAction("viewProposals")}
            >
              {t("Proposals.rfq.actions.viewProposals", {
                count: rfq.proposalsReceived,
              })}
              <Icon as={LuArrowRight} boxSize="14px" />
            </Button>
            <Button
              {...OUTLINE_BUTTON}
              onClick={() => onAction("requestRevision")}
            >
              {t("Proposals.rfq.actions.requestRevision")}
            </Button>
          </>
        )}
        {rfq.status === "awaiting" && (
          <Button {...OUTLINE_BUTTON} onClick={() => onAction("follow")}>
            {t("Proposals.rfq.actions.follow")}
          </Button>
        )}
        {rfq.status === "converted" && (
          <Button
            {...ACTION_BUTTON}
            px="16px"
            bg="#EDFBF5"
            borderWidth="1px"
            borderColor="#AAECD5"
            color="#10B981"
            fontWeight={600}
            _hover={{ bg: "#DDF7EC" }}
            onClick={() => onAction("viewOrder")}
          >
            <Icon as={LuCircleCheck} boxSize="13px" />
            {t("Proposals.rfq.actions.viewOrder")}
          </Button>
        )}
        {(rfq.status === "expired" || rfq.status === "cancelled") && (
          <Button
            {...PRIMARY_BUTTON}
            px="16px"
            onClick={() => onAction("newRfq")}
          >
            <Icon as={LuPlus} boxSize="13px" />
            {t("Proposals.rfq.actions.newRfq")}
          </Button>
        )}
        {isCancellable && (
          <Button
            {...OUTLINE_BUTTON}
            ms="auto"
            borderColor="#FECACA"
            color="#EF4444"
            _hover={{ bg: "#FEF2F2" }}
            onClick={() => onAction("cancel")}
          >
            {t("Proposals.rfq.actions.cancel")}
          </Button>
        )}
      </Flex>
    </Stack>
  );
}
