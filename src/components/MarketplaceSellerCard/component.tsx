"use client";

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuBadgeCheck, LuStore } from "react-icons/lu";

import { MarketplaceSellerCardProps } from "./interface";

const BACKGROUND_IMAGE_URL = "/assets/Fundo-atualizado-Neutra%201.svg";
const BENEFIT_KEYS = ["noFee", "split", "score"] as const;

/**
 * Card de conversão para quem vende no marketplace.
 * Fundo escuro com a lista de benefícios e botão verde de cadastro.
 */
export function MarketplaceSellerCard({
  href = "/register?type=seller",
}: MarketplaceSellerCardProps) {
  const { t } = useTranslation();

  return (
    <Box
      position="relative"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      rounded="24px"
      h="full"
      minH="360px"
      p={{ base: "24px", md: "32px" }}
      bgColor="#0B1220"
      bgImage={`linear-gradient(110deg, rgba(11, 18, 32, 0.35), rgba(8, 32, 36, 0.35)), url("${BACKGROUND_IMAGE_URL}")`}
      bgSize="cover"

      bgRepeat="no-repeat"
      borderWidth="1px"
      borderColor="rgba(255, 255, 255, 0.12)"
      color="white"
    >
      <Stack position="relative" gap={0} maxW="360px" align="flex-start">
        <Flex
          align="center"
          gap="6px"
          mb="16px"
          h="30px"
          p="4.926px 14.779px"
          rounded="full"
          bg="rgba(16, 185, 129, 0.15)"
          borderWidth="1px"
          borderColor="rgba(16, 185, 129, 0.3)"
          color="#34D399"
          fontSize="13px"
          fontWeight={700}
          lineHeight="16.5px"
          textTransform="uppercase"
        >
          <Icon as={LuStore} boxSize="12px" />
          {t("Marketplace.catalog.seller.badge")}
        </Flex>

        <Text
          as="h3"
          fontSize={{ base: "22px", md: "26px" }}
          fontWeight={700}
          lineHeight={{ base: "28px", md: "30px" }}
        >
          {t("Marketplace.catalog.seller.title")}
        </Text>

        <Stack as="ul" gap="10px" pt="20px" listStyleType="none">
          {BENEFIT_KEYS.map((key) => (
            <Flex as="li" key={key} align="center" gap="10px">
              <Icon
                as={LuBadgeCheck}
                boxSize="16px"
                flexShrink={0}
                color="#10B981"
              />
              <Text fontSize="16px" lineHeight="24px" color="#CBD5E1">
                {t(`Marketplace.catalog.seller.benefits.${key}`)}
              </Text>
            </Flex>
          ))}
        </Stack>
      </Stack>

      <Button
        asChild
        variant="plain"
        position="relative"
        w="full"
        h="52px"
        px="16px"
        gap="8px"
        rounded="14px"
        bg="#10B981"
        color="#052B2A"
        fontSize="14px"
        fontWeight={700}
        lineHeight="21px"
        _hover={{ bg: "#0EA672" }}
      >
        <Link href={href}>
          {t("Marketplace.catalog.seller.cta")}
          <Icon as={LuArrowRight} boxSize="16px" />
        </Link>
      </Button>
    </Box>
  );
}
