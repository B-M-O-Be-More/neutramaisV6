"use client";

import { Button, Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { ProposalsTab, ProposalsTabsProps } from "./interface";

const TABS: ProposalsTab[] = ["direct", "rfq"];

/** Alternância entre "Propostas/Ofertas" e "Cotação/RFQ" (Figma 2037-16781). */
export function ProposalsTabs({ value, onChange }: ProposalsTabsProps) {
  const { t } = useTranslation();

  return (
    <Flex
      role="tablist"
      aria-label={t("Proposals.tabs.label")}
      gap="12px"
      p="6.25px"
      bg="white"
      borderWidth="0.25px"
      borderColor="#757575"
      rounded="14px"
      overflowX="auto"
    >
      {TABS.map((tab) => {
        const isActive = tab === value;
        return (
          <Button
            key={tab}
            role="tab"
            aria-selected={isActive}
            variant="plain"
            h="37px"
            px="12px"
            py="8px"
            rounded="10px"
            bg={isActive ? "#1F5AFF" : "transparent"}
            color={isActive ? "white" : "#8A9AB5"}
            fontSize="14px"
            fontWeight={isActive ? 600 : 400}
            lineHeight="21px"
            flexShrink={0}
            _hover={{ bg: isActive ? "#1F5AFF" : "#F4F6F9" }}
            onClick={() => onChange(tab)}
          >
            {t(`Proposals.tabs.${tab}`)}
          </Button>
        );
      })}
    </Flex>
  );
}
