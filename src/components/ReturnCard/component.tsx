"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { LuClock, LuPackage } from "react-icons/lu";

import ReturnStatusBadge from "@/components/ReturnStatusBadge";
import { formatProposalMoney } from "@/functions/proposalFormat";
import { isReturnSlaUrgent, returnSlaHours } from "@/functions/returnSla";

import { ReturnCardProps } from "./interface";

/**
 * Devolução na lista do buyer (Figma 2943-31401): produto, tipo, números,
 * seller e motivo; status, valor e o prazo do seller. Abre o detalhe.
 */
export function ReturnCard({ item, locale, now }: ReturnCardProps) {
  const { t } = useTranslation();
  const slaHours = returnSlaHours(item, now);

  return (
    <Box
      display="flex"
      alignItems="center"
      gap="16px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="12px"
      transition="border-color 0.15s"
      _hover={{ borderColor: "#C7D8FF" }}
      _focusVisible={{ outline: "2px solid #1F5AFF", outlineOffset: "2px" }}
      asChild
    >
      <NextLink href={`/returns/${encodeURIComponent(item.id)}`}>
        <Flex
          boxSize="44px"
          align="center"
          justify="center"
          flexShrink={0}
          bg="#F4F6F9"
          rounded="12px"
          display={{ base: "none", sm: "flex" }}
        >
          <Icon as={LuPackage} boxSize="18px" color="#8A9AB5" aria-hidden />
        </Flex>

        <Stack gap="4px" flex="1" minW={0}>
          <Flex align="center" gap="8px" wrap="wrap">
            <Text
              as="h2"
              color="#0F1729"
              fontSize="14px"
              fontWeight={700}
              lineHeight="21px"
            >
              {t("Returns.productWithQuantity", {
                name: item.productName,
                count: item.quantity,
              })}
            </Text>
            <Text
              as="span"
              px="8px"
              py="2px"
              bg="#F4F6F9"
              rounded="4px"
              color="#5A6478"
              fontSize="9px"
              fontWeight={700}
              lineHeight="13.5px"
            >
              {t(`Returns.types.${item.type}.label`)}
            </Text>
          </Flex>
          <Text truncate color="#8A9AB5" fontSize="11px" lineHeight="16.5px">
            {[item.id, item.orderId, item.sellerName].join(" · ")}
          </Text>
          <Text color="#5A6478" fontSize="11px" lineHeight="16.5px">
            {t(`Returns.reasons.${item.reason}`)}
          </Text>
        </Stack>

        <Stack gap={0} align="flex-end" flexShrink={0} textAlign="right">
          <ReturnStatusBadge status={item.status} />
          <Text
            pt="8px"
            color="#0F1729"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
            whiteSpace="nowrap"
          >
            {formatProposalMoney(item.amount, locale)}
          </Text>
          {slaHours !== null && (
            <Flex
              align="center"
              gap="4px"
              pt="4px"
              color={isReturnSlaUrgent(slaHours) ? "#EF4444" : "#D97706"}
            >
              <Icon as={LuClock} boxSize="10px" aria-hidden />
              <Text fontSize="10px" fontWeight={700} lineHeight="15px">
                {t("Returns.slaLeft", { count: slaHours })}
              </Text>
            </Flex>
          )}
        </Stack>
      </NextLink>
    </Box>
  );
}
