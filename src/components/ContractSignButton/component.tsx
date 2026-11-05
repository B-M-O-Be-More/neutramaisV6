"use client";

import { Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuExternalLink, LuPenLine } from "react-icons/lu";

import ContractActionButton from "@/components/ContractActionButton";

import { ContractSignButtonProps } from "./interface";

/**
 * Ação de assinatura do contrato: "Assinar contrato" para o primeiro
 * signatário do Buyer, "Abrir assinatura" para quem já está vinculado (o link
 * sai de novo pelo /sign) e um aviso quando outro usuário está vinculado.
 */
export function ContractSignButton({
  signAction,
  isSigning,
  onSign,
  block = false,
}: ContractSignButtonProps) {
  const { t } = useTranslation();

  if (signAction === "none") return null;

  if (signAction === "boundToOther") {
    return (
      <Text
        color="#8A9AB5"
        fontSize="12px"
        lineHeight="18px"
        textAlign={block ? "center" : undefined}
      >
        {t("Contracts.sign.boundToOther")}
      </Text>
    );
  }

  return (
    <ContractActionButton
      block={block}
      tone="primary"
      icon={signAction === "sign" ? LuPenLine : LuExternalLink}
      loading={isSigning}
      onClick={onSign}
    >
      {t(signAction === "sign" ? "Contracts.sign.sign" : "Contracts.sign.open")}
    </ContractActionButton>
  );
}
