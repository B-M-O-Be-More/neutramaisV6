"use client";

import { Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuTruck } from "react-icons/lu";

import { RETURN_FREIGHT_PAYER } from "@/data/returnStatus";

import { ReturnFreightProps } from "./interface";

/** Quem paga o frete de retorno e por quê (Figma 2943-31585). */
export function ReturnFreight({ reason }: ReturnFreightProps) {
  const { t } = useTranslation();
  const payer = RETURN_FREIGHT_PAYER[reason];

  return (
    <Stack
      as="section"
      gap="12px"
      p="16px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="12px"
    >
      <Text
        as="h2"
        color="#0F1729"
        fontSize="11px"
        fontWeight={700}
        lineHeight="16.5px"
      >
        {t("Returns.detail.freight")}
      </Text>
      <Flex gap="8px" align="flex-start">
        <Icon
          as={LuTruck}
          boxSize="14px"
          mt="3px"
          flexShrink={0}
          color="#1F5AFF"
          aria-hidden
        />
        <Text color="#5A6478" fontSize="11px" lineHeight="20px">
          {t("Returns.freight.summary", {
            payer: t(`Returns.freight.payers.${payer}`),
            reason: t(`Returns.freight.reasons.${reason}`),
          })}
        </Text>
      </Flex>
    </Stack>
  );
}
