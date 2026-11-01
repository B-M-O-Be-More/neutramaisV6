"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuCircleAlert,
  LuCircleCheckBig,
  LuClock,
  LuDownload,
  LuTrendingUp,
} from "react-icons/lu";

import ContractDetailPanel from "@/components/ContractDetailPanel";
import { formatBillingMonth } from "@/functions/contractFormat";
import {
  formatProposalMoney,
  formatShortDate,
} from "@/functions/proposalFormat";
import type { ContractPaymentStatus } from "@/types/contracts";

import { ContractPaymentsProps } from "./interface";

// Paga segue o design (Figma 2190-14198); pendente e vencida usam as cores
// de aviso e erro dos selos de status.
const STATUS_STYLES: Record<
  ContractPaymentStatus,
  { bg: string; color: string; icon: IconType }
> = {
  paid: { bg: "#EDFBF5", color: "#10B981", icon: LuCircleCheckBig },
  pending: { bg: "#FFFBEB", color: "#D97706", icon: LuClock },
  overdue: { bg: "#FEF2F2", color: "#EF4444", icon: LuCircleAlert },
};

/** Faturas do contrato, da mais recente à mais antiga (Figma 2190-14189). */
export function ContractPayments({
  payments,
  locale,
  onDownloadInvoice,
}: ContractPaymentsProps) {
  const { t } = useTranslation();

  return (
    <ContractDetailPanel
      title={t("Contracts.detail.payments")}
      icon={LuTrendingUp}
      iconColor="#10B981"
    >
      {payments.length === 0 ? (
        <Text px="20px" py="16px" color="#8A9AB5" fontSize="12px">
          {t("Contracts.detail.noPayments")}
        </Text>
      ) : (
        payments.map((payment, index) => {
          const status = STATUS_STYLES[payment.status];
          return (
            <Flex
              key={payment.id}
              align="center"
              gap="12px"
              px="20px"
              py="14px"
              borderBottomWidth={index < payments.length - 1 ? "1px" : 0}
              borderColor="#F4F6F9"
            >
              <Flex
                boxSize="32px"
                align="center"
                justify="center"
                flexShrink={0}
                bg={status.bg}
                rounded="10px"
              >
                <Icon
                  as={status.icon}
                  boxSize="14px"
                  color={status.color}
                  aria-label={t(`Contracts.paymentStatuses.${payment.status}`)}
                />
              </Flex>
              <Stack gap={0} flex="1" minW={0}>
                <Text
                  color="#0F1729"
                  fontSize="13px"
                  fontWeight={600}
                  lineHeight="19.5px"
                >
                  {formatBillingMonth(payment.dueDate, locale)}
                </Text>
                <Text
                  truncate
                  color="#A0ABB8"
                  fontSize="11px"
                  lineHeight="16.5px"
                >
                  {t("Contracts.detail.paymentDue", {
                    date: formatShortDate(payment.dueDate, locale),
                    invoice: payment.invoiceNumber,
                  })}
                </Text>
              </Stack>
              <Text
                color={status.color}
                fontSize="13px"
                fontWeight={700}
                lineHeight="19.5px"
                whiteSpace="nowrap"
              >
                {formatProposalMoney(payment.amount, locale)}
              </Text>
              <Button
                variant="plain"
                h="auto"
                minW={0}
                p={0}
                gap="4px"
                color="#1F5AFF"
                fontSize="11px"
                fontWeight={500}
                lineHeight="16.5px"
                aria-label={t("Contracts.detail.downloadInvoice", {
                  invoice: payment.invoiceNumber,
                })}
                onClick={() => onDownloadInvoice(payment)}
              >
                <Icon as={LuDownload} boxSize="11px" />
                {t("Contracts.detail.invoice")}
              </Button>
            </Flex>
          );
        })
      )}
    </ContractDetailPanel>
  );
}
