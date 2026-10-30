"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuCircleX, LuPencil, LuShieldCheck } from "react-icons/lu";

import ProposalsDialogFrame, {
  PROPOSALS_DIALOG_BUTTONS,
} from "@/components/ProposalsDialogFrame";
import ProposalsNotice from "@/components/ProposalsNotice";
import ProposalStatusBadge from "@/components/ProposalStatusBadge";
import ProposalsTermsTable, {
  type ProposalsTermsRow,
} from "@/components/ProposalsTermsTable";
import ProposalTag from "@/components/ProposalTag";
import { DIRECT_PROPOSAL_STATUS_STYLES } from "@/data/proposalStatus";
import { formatDateTime } from "@/functions/formatDateTime";
import {
  formatProposalMoney,
  sellerInitials,
} from "@/functions/proposalFormat";
import { isDirectProposalOpen } from "@/hooks/useDirectProposals";

import { DirectProposalDetailsDialogProps } from "./interface";

/**
 * Detalhe de uma proposta direta (Figma 2063-31324; aceita: 2068-34051):
 * seller, condições e, enquanto não há aceite, cancelar ou revisar.
 */
export function DirectProposalDetailsDialog({
  proposal,
  locale,
  onClose,
  onRevise,
  onCancel,
}: DirectProposalDetailsDialogProps) {
  const { t } = useTranslation();

  const isAccepted = proposal?.status === "accepted";
  const isOpen = proposal ? isDirectProposalOpen(proposal.status) : false;

  const rows: ProposalsTermsRow[] = proposal
    ? [
        {
          key: "price",
          label: t("Proposals.direct.details.price"),
          value: t("Proposals.direct.details.priceValue", {
            amount: formatProposalMoney(proposal.price, locale),
            currency: proposal.price.currency,
          }),
        },
        {
          key: "sla",
          label: t("Proposals.direct.details.sla"),
          value: proposal.sla,
        },
        {
          key: "delivery",
          label: t("Proposals.direct.details.delivery"),
          value: t("Proposals.direct.businessDays", {
            count: proposal.deliveryBusinessDays,
          }),
        },
        {
          key: "validity",
          label: t("Proposals.direct.details.validity"),
          value: t("Proposals.direct.days", { count: proposal.validityDays }),
        },
        {
          key: "cancellation",
          label: t("Proposals.direct.details.cancellation"),
          value: proposal.cancellationPolicy,
        },
        ...(proposal.notes
          ? [
              {
                key: "notes",
                label: t("Proposals.direct.details.notes"),
                value: proposal.notes,
              },
            ]
          : []),
      ]
    : [];

  return (
    <ProposalsDialogFrame
      open={proposal !== null}
      onClose={onClose}
      title={
        proposal && (
          <>
            {t(
              isAccepted
                ? "Proposals.direct.details.acceptedTitle"
                : "Proposals.direct.details.title",
            )}{" "}
            <Text as="span" fontWeight={600}>
              : {proposal.id}
            </Text>
          </>
        )
      }
      footer={
        isOpen && proposal ? (
          <>
            <Button
              {...PROPOSALS_DIALOG_BUTTONS.dangerOutline}
              onClick={() => onCancel(proposal)}
            >
              <Icon as={LuCircleX} boxSize="14px" />
              {t("Proposals.direct.actions.cancel")}
            </Button>
            <Button
              {...PROPOSALS_DIALOG_BUTTONS.primary}
              onClick={() => onRevise(proposal)}
            >
              <Icon as={LuPencil} boxSize="14px" />
              {t("Proposals.direct.actions.revise")}
            </Button>
          </>
        ) : undefined
      }
    >
      {proposal && (
        <Stack gap="20px">
          <Flex gap="16px" align="flex-start">
            <Flex
              align="center"
              justify="center"
              boxSize="48px"
              flexShrink={0}
              bg="#EEF3FF"
              borderWidth="1px"
              borderColor="#C7D8FF"
              rounded="14px"
              color="#1F5AFF"
              fontSize="13px"
              fontWeight={800}
              lineHeight="19.5px"
              aria-hidden
            >
              {sellerInitials(proposal.seller.name)}
            </Flex>
            <Stack gap={0} flex="1" minW={0}>
              <Flex align="center" gap="8px" wrap="wrap">
                <Text
                  color="#0F1729"
                  fontSize="16px"
                  fontWeight={800}
                  lineHeight="24px"
                >
                  {proposal.seller.name}
                </Text>
                {proposal.seller.kycVerified && (
                  <ProposalTag
                    tone="green"
                    size="md"
                    icon={LuShieldCheck}
                    label={t("Proposals.direct.details.kycVerified")}
                  />
                )}
              </Flex>
              <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
                {proposal.seller.taxId}
              </Text>
            </Stack>
            <ProposalStatusBadge
              size="lg"
              status={DIRECT_PROPOSAL_STATUS_STYLES[proposal.status]}
              label={t(
                isAccepted
                  ? "Proposals.direct.details.acceptedStatus"
                  : `Proposals.direct.status.${proposal.status}`,
              )}
            />
          </Flex>

          <ProposalsTermsTable
            title={proposal.productName}
            subtitle={t(
              `SellerOfferCreate.categories.${proposal.category}.label`,
            )}
            rows={rows}
            footer={
              <>
                <Text as="span">
                  {t("Proposals.direct.details.dates", {
                    sent: formatDateTime(proposal.sentAt, locale),
                    expires: formatDateTime(proposal.expiresAt, locale),
                  })}
                </Text>
                <Text as="span">{proposal.id}</Text>
              </>
            }
          />

          {proposal.sellerMessage && (
            <ProposalsNotice
              tone="warning"
              title={t("Proposals.direct.card.sellerMessage")}
            >
              {proposal.sellerMessage}
            </ProposalsNotice>
          )}

          {isAccepted && (
            <ProposalsNotice
              tone="success"
              title={t("Proposals.direct.details.acceptedNotice.title")}
            >
              {t("Proposals.direct.details.acceptedNotice.description")}
            </ProposalsNotice>
          )}
        </Stack>
      )}
    </ProposalsDialogFrame>
  );
}
