"use client";

import { Button, Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { WithdrawStepActionsProps } from "./interface";

/** "← Voltar" e o avanço da etapa, lado a lado (Figma 2341-80192). */
export function WithdrawStepActions({
  onBack,
  nextLabel,
  onNext,
  nextDisabled = false,
}: WithdrawStepActionsProps) {
  const { t } = useTranslation();

  return (
    <Flex gap="12px">
      <Button
        type="button"
        variant="outline"
        flex="1"
        h="52px"
        borderColor="#E5E8EE"
        rounded="13px"
        color="#8A9AB5"
        fontSize="12px"
        fontWeight={500}
        disabled={!onBack}
        onClick={onBack}
      >
        {t("Wallet.withdraw.nav.back")}
      </Button>
      <Button
        type="button"
        flex="1"
        h="52px"
        bg="#1F5AFF"
        rounded="16px"
        color="white"
        fontSize="16px"
        fontWeight={700}
        boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
        _hover={{ bg: "#1A4FE0" }}
        disabled={nextDisabled}
        onClick={onNext}
      >
        {nextLabel}
      </Button>
    </Flex>
  );
}
