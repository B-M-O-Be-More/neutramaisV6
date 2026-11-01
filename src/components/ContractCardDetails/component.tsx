"use client";

import { Box, Flex, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuCircleX, LuFileText, LuPenLine, LuTrendingUp } from "react-icons/lu";

import ContractActionButton from "@/components/ContractActionButton";
import ContractCancelConfirm from "@/components/ContractCancelConfirm";
import FormContractAmendment from "@/components/Forms/FormContractAmendment";
import { formatAdjustment, formatPercent } from "@/functions/contractFormat";
import {
  formatProposalMoney,
  formatShortDate,
} from "@/functions/proposalFormat";
import { daysUntil } from "@/hooks/useContracts";

import { ContractCardDetailsProps } from "./interface";

type Mode = "idle" | "amendment" | "cancel";

/** Termo do contrato em destaque (renovação, SLA, fidelidade, multa). */
function Term({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap="4px" p="12px" bg="#F8F9FB" rounded="10px" minW={0}>
      <Text
        truncate
        color="#A0ABB8"
        fontSize="9px"
        fontWeight={700}
        lineHeight="13.5px"
        letterSpacing="0.45px"
        textTransform="uppercase"
      >
        {label}
      </Text>
      <Text
        color="#0F1729"
        fontSize="13px"
        fontWeight={600}
        lineHeight="19.5px"
      >
        {value}
      </Text>
    </Stack>
  );
}

/**
 * Termos e ações de um contrato aberto na lista (Figma 2084-12095): renovação,
 * SLA, fidelidade, multa, reajuste e os pedidos de aditivo e cancelamento.
 */
export function ContractCardDetails({
  contract,
  locale,
  now,
  isPending,
  onToggleAutoRenew,
  onSubmitAmendment,
  onConfirmCancellation,
}: ContractCardDetailsProps) {
  const { t } = useTranslation();
  const [mode, setMode] = React.useState<Mode>("idle");
  const exitFee = contract.exitFee
    ? formatProposalMoney(contract.exitFee, locale)
    : null;

  const submitAmendment = async (description: string) => {
    if (await onSubmitAmendment(description)) setMode("idle");
  };

  const confirmCancellation = async () => {
    if (await onConfirmCancellation()) setMode("idle");
  };

  return (
    <Stack
      gap="20px"
      px="20px"
      pt="20px"
      pb="20px"
      borderTopWidth="1px"
      borderColor="#F4F6F9"
    >
      <SimpleGrid columns={{ base: 2, md: 4 }} gap="16px">
        <Term
          label={t("Contracts.details.renewsAt")}
          value={t("Contracts.details.renewsAtValue", {
            date: formatShortDate(contract.renewsAt, locale),
            count: daysUntil(contract.renewsAt, now),
          })}
        />
        <Term
          label={t("Contracts.details.sla")}
          value={formatPercent(contract.slaPercent, locale)}
        />
        <Term
          label={t("Contracts.details.loyalty")}
          value={t("Contracts.months", { count: contract.loyaltyMonths })}
        />
        <Term
          label={t("Contracts.details.exitFee")}
          value={exitFee ?? t("Contracts.details.noExitFee")}
        />
      </SimpleGrid>

      {contract.adjustment && (
        <Flex
          gap="12px"
          align="flex-start"
          p="16px"
          bg="#F4F6F9"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="10px"
        >
          <Icon
            as={LuTrendingUp}
            boxSize="14px"
            mt="2px"
            flexShrink={0}
            color="#5A6478"
            aria-hidden
          />
          <Stack gap="2px" minW={0}>
            <Text
              color="#0F1729"
              fontSize="13px"
              fontWeight={700}
              lineHeight="19.5px"
            >
              {t("Contracts.details.adjustment", {
                value: formatAdjustment(contract.adjustment, locale),
              })}
            </Text>
            <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
              {t("Contracts.details.adjustmentNote")}
            </Text>
          </Stack>
        </Flex>
      )}

      {mode === "amendment" && (
        <FormContractAmendment
          id={`contract-${contract.id}-amendment`}
          variant="inline"
          isSubmitting={isPending}
          onSubmit={({ description }) => submitAmendment(description)}
          onCancel={() => setMode("idle")}
        />
      )}

      {mode === "cancel" && (
        <Box
          p="16px"
          bg="white"
          borderWidth="1px"
          borderColor="#FECACA"
          rounded="14px"
        >
          <ContractCancelConfirm
            exitFee={exitFee}
            isSubmitting={isPending}
            onBack={() => setMode("idle")}
            onConfirm={confirmCancellation}
          />
        </Box>
      )}

      <Flex
        gap="8px"
        wrap="wrap"
        pt="8px"
        borderTopWidth="1px"
        borderColor="#F4F6F9"
      >
        <ContractActionButton
          tone="primary"
          icon={LuPenLine}
          aria-expanded={mode === "amendment"}
          onClick={() => setMode("amendment")}
        >
          {t("Contracts.actions.amendment")}
        </ContractActionButton>
        <ContractActionButton
          tone="neutral"
          icon={LuCircleX}
          disabled={isPending}
          onClick={onToggleAutoRenew}
        >
          {t(
            contract.autoRenew
              ? "Contracts.actions.disableAutoRenew"
              : "Contracts.actions.enableAutoRenew",
          )}
        </ContractActionButton>
        <Box flex="1" display={{ base: "none", md: "block" }} />
        <ContractActionButton
          tone="danger"
          icon={LuCircleX}
          disabled={contract.cancellationRequested}
          aria-expanded={mode === "cancel"}
          onClick={() => setMode("cancel")}
        >
          {t(
            contract.cancellationRequested
              ? "Contracts.actions.cancellationRequested"
              : "Contracts.actions.cancel",
          )}
        </ContractActionButton>
        <ContractActionButton
          tone="neutral"
          icon={LuFileText}
          href={`/contracts/${encodeURIComponent(contract.id)}`}
        >
          {t("Contracts.actions.viewFull")}
        </ContractActionButton>
      </Flex>
    </Stack>
  );
}
