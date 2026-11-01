"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuPenLine, LuPlus } from "react-icons/lu";

import ContractDetailPanel from "@/components/ContractDetailPanel";
import FormContractAmendment from "@/components/Forms/FormContractAmendment";
import { formatShortDate } from "@/functions/proposalFormat";
import type { ContractChangeRequestStatus } from "@/types/contracts";

import { ContractChangeRequestsProps } from "./interface";

const STATUS_COLORS: Record<
  ContractChangeRequestStatus,
  { bg: string; color: string }
> = {
  pending: { bg: "#FFFBEB", color: "#D97706" },
  accepted: { bg: "#EDFBF5", color: "#10B981" },
  rejected: { bg: "#FEF2F2", color: "#EF4444" },
};

/**
 * Aditivos (change requests) do contrato e o formulário de um novo pedido
 * (Figma 2190-14286).
 */
export function ContractChangeRequests({
  contractId,
  requests,
  locale,
  isFormOpen,
  isSubmitting,
  onOpenForm,
  onCloseForm,
  onSubmit,
}: ContractChangeRequestsProps) {
  const { t } = useTranslation();

  return (
    <ContractDetailPanel
      id={`contract-${contractId}-change-requests`}
      title={t("Contracts.detail.changeRequests")}
      icon={LuPenLine}
      iconColor="#8B5CF6"
      headerExtra={
        <Text
          as="span"
          px="8px"
          py="2px"
          bg="#F3EEFF"
          rounded="full"
          color="#8B5CF6"
          fontSize="11px"
          lineHeight="16.5px"
        >
          {requests.length}
        </Text>
      }
      headerAction={
        <Button
          h="auto"
          px="10px"
          py="6.5px"
          gap="6px"
          bg="#8B5CF6"
          rounded="10px"
          color="white"
          fontSize="12px"
          fontWeight={700}
          lineHeight="18px"
          flexShrink={0}
          _hover={{ bg: "#7C4DEB" }}
          aria-expanded={isFormOpen}
          onClick={onOpenForm}
        >
          <Icon as={LuPlus} boxSize="12px" />
          {t("Contracts.detail.newAmendment")}
        </Button>
      }
    >
      {isFormOpen && (
        <FormContractAmendment
          id={`contract-${contractId}-amendment`}
          variant="section"
          isSubmitting={isSubmitting}
          onSubmit={({ description }) => onSubmit(description)}
          onCancel={onCloseForm}
        />
      )}

      {requests.map((request) => {
        const colors = STATUS_COLORS[request.status];
        return (
          <Flex
            key={request.id}
            align="flex-start"
            gap="12px"
            px="20px"
            py="14px"
            borderTopWidth="1px"
            borderColor="#F4F6F9"
          >
            <Stack gap={0} flex="1" minW={0}>
              <Text color="#0F1729" fontSize="13px" lineHeight="19.5px">
                {request.description}
              </Text>
              <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
                {t("Contracts.detail.changeRequestMeta", {
                  id: request.id,
                  date: formatShortDate(request.requestedAt, locale),
                })}
              </Text>
            </Stack>
            <Text
              as="span"
              flexShrink={0}
              px="10px"
              py="2px"
              bg={colors.bg}
              rounded="full"
              color={colors.color}
              fontSize="11px"
              fontWeight={600}
              lineHeight="16.5px"
            >
              {t(`Contracts.changeRequestStatuses.${request.status}`)}
            </Text>
          </Flex>
        );
      })}

      {!isFormOpen && requests.length === 0 && (
        <Text px="20px" py="16px" color="#8A9AB5" fontSize="12px">
          {t("Contracts.detail.noChangeRequests")}
        </Text>
      )}
    </ContractDetailPanel>
  );
}
