"use client";

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuPackage } from "react-icons/lu";

import { ServiceOrderSummaryCardProps } from "./interface";

/**
 * Card resumido de uma ordem ou demanda (Figma 2191-24781): fundo e faixa
 * no tom do status, produto, contraparte e prazo; selo, valor e situação à
 * direita; "Ver detalhes" e as ações ao pé.
 */
export function ServiceOrderSummaryCard({
  title,
  meta,
  alert,
  statusLabel,
  statusStyle,
  amount,
  caption,
  captionAccent = false,
  detailsHref,
  actions,
}: ServiceOrderSummaryCardProps) {
  const { t } = useTranslation();
  const { tone, icon } = statusStyle;

  return (
    <Stack
      as="article"
      aria-label={title}
      position="relative"
      gap="16px"
      p="20px"
      ps="24px"
      bg={tone.bg}
      borderWidth="1px"
      borderColor={tone.border}
      rounded="14px"
      overflow="hidden"
    >
      <Box
        aria-hidden
        position="absolute"
        insetY={0}
        insetStart={0}
        w="6px"
        bg={tone.color}
      />

      <Flex
        gap="16px"
        justify="space-between"
        direction={{ base: "column", md: "row" }}
      >
        <Flex gap="12px" align="flex-start" minW={0}>
          <Flex
            align="center"
            justify="center"
            boxSize="40px"
            flexShrink={0}
            bg="#EEF3FF"
            borderWidth="1px"
            borderColor="#C7D8FF"
            rounded="14px"
            aria-hidden
          >
            <Icon as={LuPackage} boxSize="16px" color="#1F5AFF" />
          </Flex>
          <Stack gap={0} minW={0}>
            <Text
              as="h3"
              color="#0F1729"
              fontSize="14px"
              fontWeight={700}
              lineHeight="21px"
            >
              {title}
            </Text>
            <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
              {meta}
            </Text>
            {alert && (
              <Flex align="center" gap="4px" pt="4px" color="#D97706">
                <Icon as={alert.icon} boxSize="11px" aria-hidden />
                <Text
                  fontSize="11px"
                  fontWeight={alert.strong ? 600 : 400}
                  lineHeight="16.5px"
                >
                  {alert.text}
                </Text>
              </Flex>
            )}
          </Stack>
        </Flex>

        <Stack
          gap="8px"
          align={{ base: "flex-start", md: "flex-end" }}
          flexShrink={0}
        >
          <Flex
            align="center"
            gap="6px"
            px="12px"
            py="4px"
            bg={tone.pillBg}
            borderWidth="1px"
            borderColor={tone.pillBorder}
            rounded="13px"
            color={tone.color}
          >
            <Icon as={icon} boxSize="11px" aria-hidden />
            <Text
              fontSize="12px"
              fontWeight={600}
              lineHeight="18px"
              whiteSpace="nowrap"
            >
              {statusLabel}
            </Text>
          </Flex>
          <Text
            color="#0F1729"
            fontSize="15px"
            fontWeight={800}
            lineHeight="22.5px"
          >
            {amount}
          </Text>
          {caption && (
            <Text
              color={captionAccent ? tone.color : "#A0ABB8"}
              fontSize={captionAccent ? "10px" : "11px"}
              lineHeight="16.5px"
              textAlign={{ md: "end" }}
            >
              {caption}
            </Text>
          )}
        </Stack>
      </Flex>

      <Flex
        align="center"
        justify="space-between"
        gap="8px"
        wrap="wrap"
        pt="12px"
        borderTopWidth="1px"
        borderColor="#F4F6F9"
      >
        <Button
          variant="plain"
          h="32px"
          px="10px"
          ms="-10px"
          gap="8px"
          color="#1F5AFF"
          fontSize="13px"
          fontWeight={600}
          lineHeight="19.5px"
          _hover={{ color: "#1646CC" }}
          asChild
        >
          <NextLink href={detailsHref}>
            {t("ServiceOrders.card.details")}
            <Icon as={LuArrowRight} boxSize="13px" />
          </NextLink>
        </Button>
        {actions && (
          <Flex gap="8px" wrap="wrap" ms="auto">
            {actions}
          </Flex>
        )}
      </Flex>
    </Stack>
  );
}
