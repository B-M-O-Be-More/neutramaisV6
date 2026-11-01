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
import React from "react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuBuilding2,
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuMapPin,
  LuPencil,
  LuSend,
  LuWallet,
  LuZap,
} from "react-icons/lu";

import FormSellerDecline from "@/components/Forms/FormSellerDecline";
import FormSellerRfqProposal, {
  type SellerRfqProposalValues,
} from "@/components/Forms/FormSellerRfqProposal";
import { parseDecimal } from "@/functions/parseDecimal";
import {
  formatProposalMoney,
  hoursUntil,
  moneyInputValue,
} from "@/functions/proposalFormat";
import { DEFAULT_SELLER_RFQ_VALIDITY_DAYS } from "@/types/sellerRfqs";
import type {
  SellerRfqStatus,
  SellerRfqValidityDays,
} from "@/types/sellerRfqs";

import { SellerRfqCardProps } from "./interface";

// Selo de status da RFQ recebida (Figma 2948-52407).
const STATUS_STYLES: Record<
  SellerRfqStatus,
  { color: string; bg: string; icon: IconType }
> = {
  awaiting: { color: "#D97706", bg: "#FFFBEB", icon: LuClock },
  proposalSent: { color: "#1F5AFF", bg: "#EEF3FF", icon: LuSend },
  converted: { color: "#10B981", bg: "#EDFBF5", icon: LuCircleCheck },
  declined: { color: "#8A9AB5", bg: "#F4F6F9", icon: LuCircleX },
  expired: { color: "#EF4444", bg: "#FEF2F2", icon: LuCircleX },
};

// Botões das ações no corpo do card.
const ACTION_BUTTON = {
  h: "auto",
  minH: "37.5px",
  px: "16px",
  py: "8px",
  gap: "8px",
  rounded: "8px",
  fontSize: "13px",
  lineHeight: "19.5px",
} as const;

/** Selo pequeno ao lado do título ("VISTORIA", "V2"). */
function TitleChip({
  label,
  color,
  bg,
  border,
}: {
  label: string;
  color: string;
  bg: string;
  border?: string;
}) {
  return (
    <Text
      as="span"
      px="8px"
      py="1px"
      rounded="6px"
      bg={bg}
      borderWidth={border ? "1px" : 0}
      borderColor={border}
      color={color}
      fontSize="9px"
      fontWeight={700}
      lineHeight="13.5px"
    >
      {label}
    </Text>
  );
}

/**
 * RFQ recebida pelo seller (Figma 2948-52385): comprador, local, prazo e
 * teto; a solicitação; o formulário da proposta, o resumo da proposta
 * enviada (com nova versão) ou o pedido gerado.
 */
export function SellerRfqCard({
  rfq,
  locale,
  now,
  isPending,
  onSendProposal,
  onDecline,
  onViewOrder,
}: SellerRfqCardProps) {
  const { t } = useTranslation();
  const [isFormOpen, setFormOpen] = React.useState(false);
  const [isDeclineOpen, setDeclineOpen] = React.useState(false);
  const [isExpanded, setExpanded] = React.useState(false);
  const bodyId = React.useId();

  const style = STATUS_STYLES[rfq.status];
  const { proposal } = rfq;
  const isOpen = rfq.status === "awaiting" || rfq.status === "proposalSent";
  const showBody = isOpen || isExpanded;
  const hoursLeft = hoursUntil(rfq.deadlineAt, now);
  const deadline = new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(rfq.deadlineAt));

  const formDefaults: Partial<SellerRfqProposalValues> = proposal
    ? {
        price: moneyInputValue(proposal.price.amount),
        sla: proposal.sla,
        deliveryDays: proposal.deliveryDays,
        validityDays: proposal.validityDays,
        requiresSiteSurvey: proposal.requiresSiteSurvey,
        notes: proposal.notes,
      }
    : {
        price: "",
        sla: "",
        validityDays: DEFAULT_SELLER_RFQ_VALIDITY_DAYS,
        requiresSiteSurvey: false,
        notes: "",
      };

  const handleSubmitProposal = async (values: SellerRfqProposalValues) => {
    const ok = await onSendProposal({
      price: { amount: parseDecimal(values.price) ?? 0, currency: "BRL" },
      sla: values.sla,
      deliveryDays: values.deliveryDays,
      validityDays: values.validityDays as SellerRfqValidityDays,
      requiresSiteSurvey: values.requiresSiteSurvey,
      notes: values.notes,
    });
    if (ok) setFormOpen(false);
  };

  const handleDecline = async ({ reason }: { reason: string }) => {
    if (await onDecline(reason)) setDeclineOpen(false);
  };

  const footer =
    rfq.status === "declined"
      ? {
          color: "#8A9AB5",
          text: rfq.declineReason
            ? t("SellerOrders.rfq.footer.declinedReason", {
                reason: rfq.declineReason,
              })
            : t("SellerOrders.rfq.footer.declined"),
        }
      : rfq.status === "expired"
        ? { color: "#EF4444", text: t("SellerOrders.rfq.footer.expired") }
        : null;

  return (
    <Box
      as="article"
      aria-label={`${rfq.productName} · ${rfq.id}`}
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="12px"
    >
      <Flex
        gap="16px"
        p="20px"
        align="flex-start"
        direction={{ base: "column", md: "row" }}
      >
        <Flex gap="16px" align="flex-start" flex="1" minW={0}>
          <Flex
            align="center"
            justify="center"
            boxSize="40px"
            flexShrink={0}
            bg="#F3EEFF"
            borderWidth="1px"
            borderColor="#D3BFFD"
            rounded="12px"
          >
            <Icon as={LuBuilding2} boxSize="16px" color="#8B5CF6" aria-hidden />
          </Flex>
          <Stack gap="2px" minW={0}>
            <Flex align="center" gap="8px" wrap="wrap">
              <Text
                color="#0F1729"
                fontSize="14px"
                fontWeight={700}
                lineHeight="21px"
              >
                {rfq.productName}
              </Text>
              {proposal?.requiresSiteSurvey && (
                <TitleChip
                  label={t("SellerOrders.rfq.siteSurvey")}
                  color="#D97706"
                  bg="#FFFBEB"
                  border="#FDE68A"
                />
              )}
              {proposal && proposal.version > 1 && (
                <TitleChip
                  label={t("SellerOrders.rfq.version", {
                    version: proposal.version,
                  })}
                  color="#1F5AFF"
                  bg="#EEF3FF"
                />
              )}
            </Flex>
            <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
              {[rfq.buyer.name, rfq.buyer.taxId, rfq.id].join(" · ")}
            </Text>
            <Flex align="center" gap="4px" color="#A0ABB8">
              <Icon as={LuMapPin} boxSize="11px" color="#EF4444" aria-hidden />
              <Text fontSize="11px" lineHeight="16.5px">
                {t("SellerOrders.rfq.locationDeadline", {
                  location: rfq.location,
                  deadline,
                })}
              </Text>
            </Flex>
            {rfq.budget && (
              <Flex align="center" gap="4px" color="#5A6478">
                <Icon
                  as={LuWallet}
                  boxSize="11px"
                  color="#D97706"
                  aria-hidden
                />
                <Text fontSize="11px" lineHeight="16.5px">
                  {rfq.budget}
                </Text>
              </Flex>
            )}
          </Stack>
        </Flex>

        <Stack
          gap="8px"
          align={{ base: "flex-start", md: "flex-end" }}
          flexShrink={0}
        >
          <Flex
            align="center"
            gap="6px"
            px="12px"
            py="4px"
            rounded="8px"
            bg={style.bg}
          >
            <Icon as={style.icon} boxSize="11px" color={style.color} />
            <Text
              color={style.color}
              fontSize="12px"
              fontWeight={600}
              lineHeight="18px"
              whiteSpace="nowrap"
            >
              {t(`SellerOrders.rfq.statuses.${rfq.status}`)}
            </Text>
          </Flex>
          {rfq.status === "awaiting" ? (
            <Flex align="center" gap="4px" color="#D97706">
              <Icon as={LuClock} boxSize="10px" aria-hidden />
              <Text fontSize="11px" fontWeight={600} lineHeight="16.5px">
                {t("SellerOrders.rfq.hoursLeft", { count: hoursLeft })}
              </Text>
            </Flex>
          ) : (
            proposal && (
              <Text
                color="#0F1729"
                fontSize="15px"
                fontWeight={800}
                lineHeight="22.5px"
              >
                {formatProposalMoney(proposal.price, locale)}
              </Text>
            )
          )}
        </Stack>
      </Flex>

      {showBody && (
        <Stack
          id={bodyId}
          gap="16px"
          p="20px"
          borderTopWidth="1px"
          borderColor="#F4F6F9"
        >
          <Stack
            gap="8px"
            p="16px"
            bg="#F8F9FB"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="8px"
          >
            <Text
              color="#A0ABB8"
              fontSize="9px"
              fontWeight={700}
              lineHeight="13.5px"
              letterSpacing="0.45px"
              textTransform="uppercase"
            >
              {t("SellerOrders.rfq.request")}
            </Text>
            <Text color="#0F1729" fontSize="13px" lineHeight="19.5px">
              {rfq.description}
            </Text>
          </Stack>

          {proposal && !isFormOpen && (
            <SimpleGrid
              columns={{ base: 2, md: 4 }}
              gap="12px"
              p="16px"
              bg="#EEF3FF"
              borderWidth="1px"
              borderColor="#C7D8FF"
              rounded="8px"
            >
              {[
                {
                  key: "price",
                  color: "#1F5AFF",
                  value: formatProposalMoney(proposal.price, locale),
                },
                { key: "sla", color: "#10B981", value: proposal.sla },
                {
                  key: "delivery",
                  color: "#5A6478",
                  value: t("SellerOrders.rfq.daysValue", {
                    count: proposal.deliveryDays,
                  }),
                },
                {
                  key: "version",
                  color: "#8B5CF6",
                  value: t("SellerOrders.rfq.version", {
                    version: proposal.version,
                  }),
                },
              ].map((cell) => (
                <Stack key={cell.key} gap="4px" minW={0}>
                  <Text
                    color="#8A9AB5"
                    fontSize="9px"
                    fontWeight={700}
                    lineHeight="13.5px"
                    letterSpacing="0.45px"
                    textTransform="uppercase"
                  >
                    {t(`SellerOrders.rfq.proposal.${cell.key}`)}
                  </Text>
                  <Text
                    color={cell.color}
                    fontSize="13px"
                    fontWeight={700}
                    lineHeight="19.5px"
                  >
                    {cell.value}
                  </Text>
                </Stack>
              ))}
            </SimpleGrid>
          )}

          {isFormOpen && (
            <FormSellerRfqProposal
              id={`seller-rfq-${rfq.id}`}
              defaultValues={formDefaults}
              isSubmitting={isPending}
              onClose={() => setFormOpen(false)}
              onSubmit={handleSubmitProposal}
            />
          )}

          {rfq.status === "awaiting" && !isFormOpen && (
            <Flex gap="8px" wrap="wrap">
              <Button
                {...ACTION_BUTTON}
                bg="#8B5CF6"
                color="white"
                fontWeight={700}
                _hover={{ bg: "#7C4DEB" }}
                disabled={isPending}
                onClick={() => {
                  setDeclineOpen(false);
                  setFormOpen(true);
                }}
              >
                <Icon as={LuSend} boxSize="13px" />
                {t("SellerOrders.rfq.form.title")}
              </Button>
              <Button
                {...ACTION_BUTTON}
                variant="plain"
                borderWidth="1px"
                borderColor="#FECACA"
                color="#EF4444"
                fontWeight={400}
                _hover={{ bg: "#FEF2F2" }}
                aria-expanded={isDeclineOpen}
                disabled={isPending}
                onClick={() => setDeclineOpen((open) => !open)}
              >
                <Icon as={LuCircleX} boxSize="13px" />
                {t("SellerOrders.rfq.decline")}
              </Button>
            </Flex>
          )}

          {rfq.status === "awaiting" && isDeclineOpen && !isFormOpen && (
            <FormSellerDecline
              id={`seller-rfq-${rfq.id}`}
              title={t("SellerOrders.rfq.declineForm.title")}
              placeholder={t("SellerOrders.rfq.declineForm.placeholder")}
              confirmLabel={t("SellerOrders.rfq.declineForm.confirm")}
              isSubmitting={isPending}
              onCancel={() => setDeclineOpen(false)}
              onSubmit={handleDecline}
            />
          )}

          {rfq.status === "proposalSent" && !isFormOpen && (
            <Flex pt="8px" borderTopWidth="1px" borderColor="#F4F6F9">
              <Button
                {...ACTION_BUTTON}
                variant="plain"
                bg="#EEF3FF"
                borderWidth="1px"
                borderColor="#C7D8FF"
                color="#1F5AFF"
                fontWeight={600}
                _hover={{ bg: "#E0E9FF" }}
                onClick={() => setFormOpen(true)}
              >
                <Icon as={LuPencil} boxSize="13px" />
                {t("SellerOrders.rfq.updateProposal")}
              </Button>
            </Flex>
          )}

          {rfq.status === "converted" && (
            <Flex
              align="center"
              gap="12px"
              pt="12px"
              borderTopWidth="1px"
              borderColor="#F4F6F9"
              wrap="wrap"
            >
              <Flex
                align="center"
                gap="8px"
                px="16px"
                py="10px"
                bg="#EDFBF5"
                borderWidth="1px"
                borderColor="#AAECD5"
                rounded="8px"
              >
                <Icon as={LuCircleCheck} boxSize="13px" color="#10B981" />
                <Text
                  color="#10B981"
                  fontSize="13px"
                  fontWeight={700}
                  lineHeight="19.5px"
                >
                  {t("SellerOrders.rfq.orderCreated")}
                </Text>
              </Flex>
              <Button
                {...ACTION_BUTTON}
                variant="plain"
                borderWidth="1px"
                borderColor="#E5E8EE"
                color="#5A6478"
                fontWeight={400}
                _hover={{ bg: "#F4F6F9" }}
                onClick={onViewOrder}
              >
                <Icon as={LuZap} boxSize="13px" />
                {t("SellerOrders.actions.viewOrder")}
              </Button>
            </Flex>
          )}
        </Stack>
      )}

      {!isOpen && (
        <Flex
          justify="flex-end"
          px="20px"
          py="12px"
          borderTopWidth="1px"
          borderColor="#F4F6F9"
        >
          <Button
            variant="plain"
            h="auto"
            p={0}
            color="#1F5AFF"
            fontSize="12px"
            fontWeight={600}
            lineHeight="18px"
            _hover={{ textDecoration: "underline" }}
            aria-expanded={isExpanded}
            aria-controls={bodyId}
            onClick={() => setExpanded((open) => !open)}
          >
            {t(
              isExpanded
                ? "SellerOrders.details.hide"
                : "SellerOrders.rfq.showDetails",
            )}
          </Button>
        </Flex>
      )}

      {footer && (
        <Flex
          align="center"
          gap="8px"
          px="20px"
          py="12px"
          borderTopWidth="1px"
          borderColor="#F4F6F9"
        >
          <Icon as={LuCircleX} boxSize="13px" color={footer.color} />
          <Text color={footer.color} fontSize="12px" lineHeight="18px">
            {footer.text}
          </Text>
        </Flex>
      )}
    </Box>
  );
}
