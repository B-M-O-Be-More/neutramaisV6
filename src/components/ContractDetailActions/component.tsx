"use client";

import { Button, Stack } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuCircleX, LuPenLine } from "react-icons/lu";

import ContractActionButton from "@/components/ContractActionButton";
import ContractCancelConfirm from "@/components/ContractCancelConfirm";
import ContractDetailPanel from "@/components/ContractDetailPanel";

import { ContractDetailActionsProps } from "./interface";

/**
 * "Ações" da coluna lateral do detalhe (Figma 2190-14382). "Solicitar
 * cancelamento" troca os botões pela confirmação com a multa (Figma
 * 2191-15331).
 */
export function ContractDetailActions({
  autoRenew,
  cancellationRequested,
  exitFee,
  isPending,
  onRequestAmendment,
  onToggleAutoRenew,
  onConfirmCancellation,
}: ContractDetailActionsProps) {
  const { t } = useTranslation();
  const [isConfirming, setIsConfirming] = React.useState(false);

  const confirmCancellation = async () => {
    if (await onConfirmCancellation()) setIsConfirming(false);
  };

  return (
    <ContractDetailPanel title={t("Contracts.actions.title")} size="sm">
      <Stack gap="8px" p="16px">
        {isConfirming ? (
          <ContractCancelConfirm
            exitFee={exitFee}
            isSubmitting={isPending}
            onBack={() => setIsConfirming(false)}
            onConfirm={confirmCancellation}
          />
        ) : (
          <>
            <ContractActionButton
              block
              tone="primary"
              icon={LuPenLine}
              onClick={onRequestAmendment}
            >
              {t("Contracts.actions.amendment")}
            </ContractActionButton>
            <ContractActionButton
              block
              tone="neutral"
              icon={LuCircleX}
              disabled={isPending}
              onClick={onToggleAutoRenew}
            >
              {t(
                autoRenew
                  ? "Contracts.actions.disableAutoRenew"
                  : "Contracts.actions.enableAutoRenew",
              )}
            </ContractActionButton>
            <ContractActionButton
              block
              tone="danger"
              icon={LuCircleX}
              disabled={cancellationRequested}
              onClick={() => setIsConfirming(true)}
            >
              {t(
                cancellationRequested
                  ? "Contracts.actions.cancellationRequested"
                  : "Contracts.actions.cancel",
              )}
            </ContractActionButton>
            <Button
              variant="plain"
              mt="4px"
              w="full"
              h="40.5px"
              bg="white"
              borderWidth="1px"
              borderColor="#E5E8EE"
              rounded="13px"
              color="#8A9AB5"
              fontSize="12px"
              fontWeight={500}
              lineHeight="18px"
              _hover={{ bg: "#F8F9FB" }}
              asChild
            >
              <NextLink href="/contracts">
                {t("Contracts.actions.back")}
              </NextLink>
            </Button>
          </>
        )}
      </Stack>
    </ContractDetailPanel>
  );
}
