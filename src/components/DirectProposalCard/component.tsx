"use client";

import {
  Box,
  Button,
  Flex,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import {
  LuArrowRight,
  LuCircleCheck,
  LuCircleX,
  LuEye,
  LuMessageSquare,
  LuPencil,
  LuPlus,
  LuShieldCheck,
} from "react-icons/lu";

import ProposalStatusBadge from "@/components/ProposalStatusBadge";
import ProposalTag from "@/components/ProposalTag";
import { DIRECT_PROPOSAL_STATUS_STYLES } from "@/data/proposalStatus";
import { formatDateTime } from "@/functions/formatDateTime";
import {
  formatProposalMoney,
  sellerInitials,
} from "@/functions/proposalFormat";
import { isDirectProposalOpen } from "@/hooks/useDirectProposals";

import { DirectProposalCardProps } from "./interface";

// Botões da linha de ações do card (Figma 2485-29168).
const ACTION_BUTTON = {
  variant: "plain",
  h: "37.5px",
  px: "16px",
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
  bg: "#1F5AFF",
  color: "white",
  fontWeight: 700,
  _hover: { bg: "#1646CC" },
} as const;

/**
 * Card de uma proposta direta (Figma 2485-29130): seller, produto, preço e
 * status; andamento da análise ou mensagem do seller; SLA, entrega e
 * validade; e as ações que o status permite.
 */
export function DirectProposalCard({
  proposal,
  locale,
  onView,
  onRevise,
  onCancel,
  onViewOrder,
}: DirectProposalCardProps) {
  const { t } = useTranslation();
  const status = DIRECT_PROPOSAL_STATUS_STYLES[proposal.status];
  const isOpen = isDirectProposalOpen(proposal.status);
  const showProgress =
    proposal.progress !== undefined &&
    (proposal.status === "awaiting" || proposal.status === "accepted");
  const progressKey = proposal.status === "accepted" ? "accepted" : "awaiting";

  const terms = [
    { key: "sla", value: proposal.sla },
    {
      key: "delivery",
      value: t("Proposals.direct.businessDays", {
        count: proposal.deliveryBusinessDays,
      }),
    },
    {
      key: "validity",
      value: t("Proposals.direct.days", { count: proposal.validityDays }),
    },
  ];

  return (
    <Stack
      as="article"
      aria-label={`${proposal.seller.name} · ${proposal.id}`}
      gap="16px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor={
        proposal.status === "revisionRequested" ? "#C7D8FF" : "#E5E8EE"
      }
      rounded="14px"
    >
      <Flex gap="12px" align={{ base: "flex-start", md: "center" }}>
        <Flex
          align="center"
          justify="center"
          boxSize="40px"
          flexShrink={0}
          bg="#EEF3FF"
          borderWidth="1px"
          borderColor="#C7D8FF"
          rounded="14px"
          color="#1F5AFF"
          fontSize="12px"
          fontWeight={800}
          lineHeight="18px"
          aria-hidden
        >
          {sellerInitials(proposal.seller.name)}
        </Flex>

        <Flex
          flex="1"
          minW={0}
          gap="12px"
          direction={{ base: "column", md: "row" }}
          align={{ base: "stretch", md: "center" }}
        >
          <Stack gap="2px" flex="1" minW={0}>
            <Flex align="center" gap="8px" wrap="wrap">
              <Text
                as="h3"
                color="#0F1729"
                fontSize="15px"
                fontWeight={700}
                lineHeight="22.5px"
              >
                {proposal.seller.name}
              </Text>
              {proposal.seller.kycVerified && (
                <ProposalTag
                  tone="green"
                  icon={LuShieldCheck}
                  label={t("Proposals.direct.card.kyc")}
                />
              )}
              {proposal.version > 1 && (
                <ProposalTag
                  tone="blue"
                  label={t("Proposals.direct.card.version", {
                    version: proposal.version,
                  })}
                />
              )}
              {proposal.sellerMessage && (
                <ProposalTag
                  tone="amber"
                  icon={LuMessageSquare}
                  label={t("Proposals.direct.card.sellerMessageTag")}
                />
              )}
            </Flex>
            <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
              {t("Proposals.direct.card.product", {
                product: proposal.productName,
                category: t(
                  `SellerOfferCreate.categories.${proposal.category}.label`,
                ),
              })}
            </Text>
            <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
              {t("Proposals.direct.card.meta", {
                sent: formatDateTime(proposal.sentAt, locale),
                expires: formatDateTime(proposal.expiresAt, locale),
                id: proposal.id,
              })}
            </Text>
          </Stack>

          <Stack
            gap={0}
            align={{ base: "flex-start", md: "flex-end" }}
            flexShrink={0}
          >
            <Text
              color="#0F1729"
              fontSize="18px"
              fontWeight={800}
              lineHeight="27px"
              textAlign={{ base: "start", md: "end" }}
            >
              {formatProposalMoney(proposal.price, locale)}
            </Text>
            <ProposalStatusBadge
              status={status}
              label={t(`Proposals.direct.status.${proposal.status}`)}
            />
          </Stack>
        </Flex>
      </Flex>

      {showProgress && (
        <Stack gap="8px" py="12px" borderTopWidth="1px" borderColor="#F4F6F9">
          <Flex
            justify="space-between"
            gap="12px"
            fontSize="11px"
            lineHeight="16.5px"
          >
            <Text color="#8A9AB5" fontWeight={700}>
              {t(`Proposals.direct.card.progress.${progressKey}.title`)}
            </Text>
            <Text color="#10B981" fontWeight={600}>
              {proposal.progress}%
            </Text>
          </Flex>
          <Box
            role="progressbar"
            aria-label={t(
              `Proposals.direct.card.progress.${progressKey}.title`,
            )}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={proposal.progress}
            h="6px"
            bg="#F4F6F9"
            rounded="3px"
            overflow="hidden"
          >
            <Box
              h="full"
              w={`${proposal.progress}%`}
              bg="#10B981"
              rounded="3px"
            />
          </Box>
          <Text color="#92400E" fontSize="11px" lineHeight="16.5px">
            {t(`Proposals.direct.card.progress.${progressKey}.description`)}
          </Text>
        </Stack>
      )}

      {proposal.sellerMessage && (
        <Stack
          gap={0}
          px="16px"
          py="10px"
          bg="#FFFBEB"
          borderWidth="1px"
          borderColor="#FDE68A"
          rounded="10px"
        >
          <Text
            color="#8A9AB5"
            fontSize="9px"
            fontWeight={700}
            lineHeight="13.5px"
            letterSpacing="0.45px"
            textTransform="uppercase"
          >
            {t("Proposals.direct.card.sellerMessage")}
          </Text>
          <Text color="#92400E" fontSize="12px" lineHeight="18px">
            {proposal.sellerMessage}
          </Text>
        </Stack>
      )}

      <SimpleGrid
        as="dl"
        columns={{ base: 1, sm: 3 }}
        gap="12px"
        pt="12px"
        borderTopWidth="1px"
        borderColor="#F4F6F9"
      >
        {terms.map((term) => (
          <Stack key={term.key} gap={0} minW={0}>
            <Text
              as="dt"
              color="#A0ABB8"
              fontSize="9px"
              fontWeight={700}
              lineHeight="13.5px"
              letterSpacing="0.45px"
              textTransform="uppercase"
            >
              {t(`Proposals.direct.card.${term.key}`)}
            </Text>
            <Text
              as="dd"
              color="#5A6478"
              fontSize="12px"
              fontWeight={600}
              lineHeight="18px"
            >
              {term.value}
            </Text>
          </Stack>
        ))}
      </SimpleGrid>

      <Flex gap="8px" wrap="wrap">
        {isOpen && (
          <Button {...PRIMARY_BUTTON} onClick={onRevise}>
            <Icon as={LuPencil} boxSize="13px" />
            {t("Proposals.direct.actions.revise")}
          </Button>
        )}
        {proposal.status === "accepted" && (
          <Button
            {...ACTION_BUTTON}
            bg="#EDFBF5"
            borderWidth="1px"
            borderColor="#AAECD5"
            color="#10B981"
            fontWeight={600}
            _hover={{ bg: "#DDF7EC" }}
            onClick={onViewOrder}
          >
            <Icon as={LuCircleCheck} boxSize="13px" />
            {t("Proposals.direct.actions.viewOrder")}
            <Icon as={LuArrowRight} boxSize="13px" />
          </Button>
        )}
        {proposal.status === "rejected" && (
          <Button {...PRIMARY_BUTTON} asChild>
            <NextLink
              href={`/proposals/new?offeringId=${encodeURIComponent(proposal.offeringId)}`}
            >
              <Icon as={LuPlus} boxSize="13px" />
              {t("Proposals.direct.actions.newProposal")}
            </NextLink>
          </Button>
        )}
        <Button {...OUTLINE_BUTTON} onClick={onView}>
          <Icon as={LuEye} boxSize="13px" />
          {t("Proposals.direct.actions.view")}
        </Button>
        {isOpen && (
          <Button
            {...OUTLINE_BUTTON}
            borderColor="#FECACA"
            color="#EF4444"
            _hover={{ bg: "#FEF2F2" }}
            onClick={onCancel}
          >
            <Icon as={LuCircleX} boxSize="13px" />
            {t("Proposals.direct.actions.cancel")}
          </Button>
        )}
      </Flex>
    </Stack>
  );
}
