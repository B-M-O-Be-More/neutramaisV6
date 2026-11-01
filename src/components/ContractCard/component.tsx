"use client";

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  LuCalendar,
  LuChevronDown,
  LuChevronUp,
  LuFileText,
  LuRotateCcw,
} from "react-icons/lu";

import {
  formatProposalMoney,
  formatShortDate,
} from "@/functions/proposalFormat";
import ContractCardDetails from "@/components/ContractCardDetails";
import { CONTRACT_STATUS_STYLES } from "@/data/contractStatus";
import { daysUntil } from "@/hooks/useContracts";

import { ContractCardProps } from "./interface";

/** Selo pequeno ao lado do nome (renovação próxima, faturas vencidas). */
function Flag({
  tone,
  children,
}: {
  tone: "warning" | "danger";
  children: ReactNode;
}) {
  const isWarning = tone === "warning";

  return (
    <Text
      as="span"
      px="9px"
      py="3px"
      bg={isWarning ? "#FFFBEB" : "#FEF2F2"}
      borderWidth="1px"
      borderColor={isWarning ? "#FDE68A" : "#FECACA"}
      rounded="8px"
      color={isWarning ? "#D97706" : "#EF4444"}
      fontSize="9px"
      fontWeight={700}
      lineHeight="13.5px"
      whiteSpace="nowrap"
    >
      {children}
    </Text>
  );
}

/**
 * Contrato do buyer: produto, seller, número, início e categoria; próxima
 * cobrança e renovação automática; status e valor. A seta abre os termos e
 * as ações (Figma 2084-12095).
 */
export function ContractCard({
  contract,
  locale,
  now,
  expanded,
  onToggle,
  ...actions
}: ContractCardProps) {
  const { t } = useTranslation();
  const status = CONTRACT_STATUS_STYLES[contract.status];
  const detailsId = `contract-${contract.id}-details`;

  return (
    <Box
      as="article"
      id={`contract-${contract.id}`}
      bg="white"
      borderWidth="1px"
      borderColor={status.cardBorder}
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
            <Flex align="center" gap="8px" wrap="wrap">
              <Text
                as="h2"
                color="#0F1729"
                fontSize="14px"
                fontWeight={700}
                lineHeight="21px"
              >
                {contract.productName}
              </Text>
              {contract.status === "renewing" && (
                <Flag tone="warning">
                  {t("Contracts.card.renewsIn", {
                    count: daysUntil(contract.renewsAt, now),
                  })}
                </Flag>
              )}
              {contract.overdueInvoices > 0 && (
                <Flag tone="danger">
                  {t("Contracts.card.overdueInvoices", {
                    count: contract.overdueInvoices,
                  })}
                </Flag>
              )}
            </Flex>

            <Text pt="2px" color="#8A9AB5" fontSize="12px" lineHeight="18px">
              {[
                contract.sellerName,
                contract.id,
                t("Contracts.card.startDate", {
                  date: formatShortDate(contract.startDate, locale),
                }),
                t(`SellerOfferCreate.categories.${contract.category}.label`),
              ].join(" · ")}
            </Text>

            <Flex
              pt="8px"
              columnGap="16px"
              rowGap="4px"
              wrap="wrap"
              color="#5A6478"
              fontSize="11px"
              lineHeight="16.5px"
            >
              <Flex align="center" gap="4px">
                <Icon
                  as={LuCalendar}
                  boxSize="11px"
                  color="#A0ABB8"
                  aria-hidden
                />
                <Text>
                  {t("Contracts.card.nextBilling", {
                    date: contract.nextBillingDate
                      ? formatShortDate(contract.nextBillingDate, locale)
                      : "—",
                  })}
                </Text>
              </Flex>
              <Flex align="center" gap="4px">
                <Icon
                  as={LuRotateCcw}
                  boxSize="11px"
                  color={contract.autoRenew ? "#10B981" : "#A0ABB8"}
                  aria-hidden
                />
                <Text>
                  {t("Contracts.card.autoRenew")}{" "}
                  <Text
                    as="span"
                    color={contract.autoRenew ? "#10B981" : "#A0ABB8"}
                    fontWeight={contract.autoRenew ? 600 : 400}
                  >
                    {t(
                      contract.autoRenew
                        ? "Contracts.card.autoRenewOn"
                        : "Contracts.card.autoRenewOff",
                    )}
                  </Text>
                </Text>
              </Flex>
            </Flex>
          </Stack>
        </Flex>

        <Stack
          gap="8px"
          align={{ base: "flex-start", md: "flex-end" }}
          flexShrink={0}
          ps={{ base: "56px", md: 0 }}
        >
          <Flex
            align="center"
            gap="6px"
            px="12px"
            py="4px"
            bg={status.bg}
            rounded="10px"
            color={status.color}
          >
            <Icon as={status.icon} boxSize="11px" aria-hidden />
            <Text fontSize="12px" fontWeight={600} lineHeight="18px">
              {t(`Contracts.statuses.${contract.status}`)}
            </Text>
          </Flex>

          <Text
            color="#0F1729"
            fontSize="16px"
            fontWeight={800}
            lineHeight="24px"
            whiteSpace="nowrap"
          >
            {formatProposalMoney(contract.price, locale)}
            <Text as="span" color="#A0ABB8" fontSize="12px" lineHeight="18px">
              {t(`Contracts.card.per.${contract.billingCycle}`)}
            </Text>
          </Text>

          <Button
            variant="plain"
            boxSize="24px"
            minW="24px"
            h="24px"
            p={0}
            m="-5px"
            rounded="6px"
            color="#A0ABB8"
            _hover={{ color: "#5A6478", bg: "#F4F6F9" }}
            aria-expanded={expanded}
            aria-controls={detailsId}
            aria-label={t(
              expanded ? "Contracts.card.collapse" : "Contracts.card.expand",
            )}
            onClick={onToggle}
          >
            <Icon as={expanded ? LuChevronUp : LuChevronDown} boxSize="14px" />
          </Button>
        </Stack>
      </Flex>

      {expanded && (
        <Box id={detailsId}>
          <ContractCardDetails
            contract={contract}
            locale={locale}
            now={now}
            {...actions}
          />
        </Box>
      )}
    </Box>
  );
}
