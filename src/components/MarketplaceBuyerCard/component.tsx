"use client";

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuBuilding2, LuShoppingCart } from "react-icons/lu";

import { MarketplaceBuyerCardProps } from "./interface";

/**
 * Card de conversão para quem compra no marketplace.
 * Fundo azul com ícone decorativo de carrinho e dois atalhos: cadastro
 * (ação principal) e catálogo público.
 */
export function MarketplaceBuyerCard({
  href = "/register?type=buyer",
  catalogHref = "/search-network",
}: MarketplaceBuyerCardProps) {
  const { t } = useTranslation();

  return (
    <Box
      position="relative"
      overflow="hidden"
      rounded="16px"
      h="full"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      px={{ base: "24px", md: "32px" }}
      py={{ base: "28px", md: "36px" }}
      bgImage="linear-gradient(135deg, #2563FF, #1338A8)"
      color="white"
    >
      {/* Anéis e carrinho decorativos no canto superior direito. */}
      <Box
        aria-hidden
        position="absolute"
        top="-70px"
        right="-50px"
        boxSize="300px"
        rounded="full"
        borderWidth="1px"
        borderColor="rgba(255, 255, 255, 0.1)"
      />
      <Box
        aria-hidden
        position="absolute"
        top="20px"
        right="-10px"
        boxSize="200px"
        rounded="full"
        borderWidth="1px"
        borderColor="rgba(255, 255, 255, 0.08)"
      />
      <Icon
        aria-hidden
        as={LuShoppingCart}
        position="absolute"
        top="36px"
        right="48px"
        boxSize="140px"
        color="rgba(255, 255, 255, 0.15)"
      />
      {/* Círculo preenchido na parte inferior direita. */}
      <Box
        aria-hidden
        position="absolute"
        bottom="25px"
        right="56px"
        boxSize="120px"
        rounded="full"
        bg="rgba(255, 255, 255, 0.08)"
      />

      <Stack position="relative" gap={0} maxW="400px" align="flex-start">
        <Flex
          align="center"
          gap="6px"
          h="30px"
          mb="16px"
          p="4.926px 14.779px"
          rounded="full"
          bg="rgba(255, 255, 255, 0.2)"
          fontSize="13px"
          fontWeight={700}
          lineHeight="16.5px"
          textTransform="uppercase"
        >
          <Icon as={LuBuilding2} boxSize="14px" />
          {t("Marketplace.catalog.buyer.badge")}
        </Flex>

        <Text
          as="h3"
          fontSize={{ base: "22px", md: "30px" }}
          fontWeight={700}
          lineHeight={{ base: "30px", md: "34px" }}
        >
          {t("Marketplace.catalog.buyer.title")}
        </Text>

        <Text
          pt="12px"
          fontSize="14px"
          lineHeight="22.75px"
          color="rgba(255, 255, 255, 0.8)"
        >
          {t("Marketplace.catalog.buyer.description")}
        </Text>

        <Flex gap="12px" pt="30px" wrap="wrap">
          <Button
            asChild
            variant="plain"
            h="auto"
            px="16px"
            py="10px"
            gap="8px"
            rounded="12px"
            bg="white"
            color="#1F5AFF"
            fontSize="14px"
            fontWeight={700}
            lineHeight="21px"
            _hover={{ bg: "rgba(255, 255, 255, 0.9)" }}
          >
            <Link href={href}>
              {t("Marketplace.catalog.buyer.primaryCta")}
              <Icon as={LuArrowRight} boxSize="16px" />
            </Link>
          </Button>

          <Button
            asChild
            variant="plain"
            h="auto"
            px="16px"
            py="10px"
            rounded="12px"
            borderWidth="1px"
            borderColor="rgba(255, 255, 255, 0.3)"
            color="white"
            fontSize="14px"
            fontWeight={600}
            lineHeight="21px"
            _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
          >
            <Link href={catalogHref}>
              {t("Marketplace.catalog.buyer.secondaryCta")}
            </Link>
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}
