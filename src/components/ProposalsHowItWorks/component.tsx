"use client";

import { Flex, Icon, IconButton, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuChevronDown, LuInfo, LuX } from "react-icons/lu";

import { ProposalsHowItWorksProps } from "./interface";

/**
 * Faixa "Propostas e RFQ · Como funcionam" no topo da página (Figma
 * 2073-38659): diferença entre proposta direta e RFQ. Recolhe e fecha.
 */
export function ProposalsHowItWorks({ onDismiss }: ProposalsHowItWorksProps) {
  const { t } = useTranslation();
  const [isExpanded, setExpanded] = React.useState(true);
  const descriptionId = React.useId();

  return (
    <Flex
      as="section"
      aria-label={t("Proposals.howItWorks.title")}
      gap="12px"
      align="flex-start"
      px="21px"
      py="17px"
      bg="#EEF3FF"
      borderWidth="1px"
      borderColor="#C7D8FF"
      rounded="14px"
    >
      <Flex
        align="center"
        justify="center"
        boxSize="32px"
        flexShrink={0}
        bg="#EEF3FF"
        borderWidth="1px"
        borderColor="#C7D8FF"
        rounded="10px"
      >
        <Icon as={LuInfo} boxSize="15px" color="#1F5AFF" aria-hidden />
      </Flex>

      <Stack gap="2px" flex="1" minW={0}>
        <Text
          color="#1F5AFF"
          fontSize="13px"
          fontWeight={700}
          lineHeight="19.5px"
        >
          {t("Proposals.howItWorks.title")}
        </Text>
        {isExpanded && (
          <Text
            id={descriptionId}
            color="#3B5FBF"
            fontSize="12px"
            lineHeight="18px"
          >
            {t("Proposals.howItWorks.description")}
          </Text>
        )}
      </Stack>

      <Flex gap="4px" flexShrink={0}>
        <IconButton
          aria-label={t(
            isExpanded
              ? "Proposals.howItWorks.collapse"
              : "Proposals.howItWorks.expand",
          )}
          aria-expanded={isExpanded}
          aria-controls={isExpanded ? descriptionId : undefined}
          variant="plain"
          boxSize="22px"
          minW="22px"
          rounded="4px"
          color="#1F5AFF"
          _hover={{ bg: "rgba(31,90,255,0.08)" }}
          onClick={() => setExpanded((current) => !current)}
        >
          <Icon
            as={LuChevronDown}
            boxSize="14px"
            transform={isExpanded ? undefined : "rotate(-90deg)"}
            transition="transform 0.15s"
          />
        </IconButton>
        <IconButton
          aria-label={t("Proposals.howItWorks.dismiss")}
          variant="plain"
          boxSize="22px"
          minW="22px"
          rounded="4px"
          color="#8A9AB5"
          _hover={{ bg: "rgba(31,90,255,0.08)" }}
          onClick={onDismiss}
        >
          <Icon as={LuX} boxSize="13px" />
        </IconButton>
      </Flex>
    </Flex>
  );
}
