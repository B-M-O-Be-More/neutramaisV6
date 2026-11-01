"use client";

import { Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuFileText } from "react-icons/lu";

import ContractDetailPanel from "@/components/ContractDetailPanel";

import { ContractClausesProps } from "./interface";

/** Cláusulas do documento do contrato (Figma 2190-14129). */
export function ContractClauses({ clauses }: ContractClausesProps) {
  const { t } = useTranslation();

  return (
    <ContractDetailPanel
      title={t("Contracts.detail.clauses")}
      icon={LuFileText}
      iconColor="#1F5AFF"
    >
      {clauses.map((clause, index) => (
        <Stack
          key={clause.title}
          gap="4px"
          px="20px"
          py="16px"
          borderBottomWidth={index < clauses.length - 1 ? "1px" : 0}
          borderColor="#F4F6F9"
        >
          <Text
            as="h3"
            color="#0F1729"
            fontSize="12px"
            fontWeight={700}
            lineHeight="18px"
          >
            {clause.title}
          </Text>
          <Text color="#5A6478" fontSize="12px" lineHeight="20.4px">
            {clause.body}
          </Text>
        </Stack>
      ))}
    </ContractDetailPanel>
  );
}
