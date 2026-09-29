"use client";

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LuArrowRight } from "react-icons/lu";

import { MarketplaceCtaBannerProps } from "./interface";

/**
 * Banner de conversão ao fim da home do marketplace.
 * Fundo escuro com chamada para cadastro e dois atalhos: conta de comprador
 * (ação principal) e de vendedor.
 */
export function MarketplaceCtaBanner({
  buyerHref = "/register?type=buyer",
  sellerHref = "/register?type=seller",
}: MarketplaceCtaBannerProps) {
  const { t } = useTranslation();

  return (
    // Mesmo respiro extra antes da seção usado nas demais seções da home.
    <Box pt={{ base: "20px", md: "44px" }}>
      <Box
        as="section"
        position="relative"
        overflow="hidden"
        rounded="16px"
        bg="#0F1729"
      >
        {/* Brilho azul decorativo à direita, atrás dos botões. */}
        <Box
          aria-hidden
          position="absolute"
          top={0}
          right={0}
          h="full"
          w="384px"
          bgImage="linear-gradient(to left, rgba(31, 90, 255, 0.2), transparent)"
        />
        <Box
          aria-hidden
          position="absolute"
          top="28px"
          right="96px"
          boxSize="192px"
          rounded="full"
          bg="rgba(31, 90, 255, 0.1)"
        />

        <Flex
          position="relative"
          direction={{ base: "column", md: "row" }}
          align={{ base: "stretch", md: "flex-start" }}
          justify="space-between"
          gap={{ base: "28px", md: "40px" }}
          p={{ base: "24px", md: "40px" }}
        >
          <Stack gap={0} maxW="576px" align="flex-start">
            <Text
              mb="12px"
              px="13px"
              py="5px"
              rounded="full"
              bg="rgba(31, 90, 255, 0.2)"
              borderWidth="1px"
              borderColor="rgba(31, 90, 255, 0.3)"
              fontSize="11px"
              fontWeight={700}
              lineHeight="16.5px"
              color="#6B9FFF"
              textTransform="uppercase"
            >
              ✦ {t("Marketplace.ctaBanner.badge")}
            </Text>
            <Text
              as="h2"
              fontSize={{ base: "22px", md: "26px" }}
              fontWeight={700}
              lineHeight={{ base: "33px", md: "39px" }}
              color="white"
            >
              {t("Marketplace.ctaBanner.title")}
            </Text>
            <Text pt="12px" fontSize="14px" lineHeight="22.75px" color="#8A9AB5">
              {t("Marketplace.ctaBanner.description")}
            </Text>
          </Stack>

          <Stack gap="12px" w={{ base: "full", md: "216px" }} flexShrink={0}>
            <Button
              asChild
              variant="plain"
              h="auto"
              px="12px"
              py="8px"
              gap="8px"
              rounded="14px"
              bg="#1F5AFF"
              color="white"
              fontSize="14px"
              fontWeight={700}
              lineHeight="21px"
              boxShadow="0px 10px 7.5px rgba(0, 0, 0, 0.1), 0px 4px 3px rgba(0, 0, 0, 0.1)"
              _hover={{ bg: "#1A4FE6" }}
            >
              <Link href={buyerHref}>
                {t("Marketplace.ctaBanner.buyerCta")}
                <Icon as={LuArrowRight} boxSize="16px" />
              </Link>
            </Button>

            <Button
              asChild
              variant="plain"
              h="auto"
              px="13px"
              py="9px"
              rounded="14px"
              borderWidth="1px"
              borderColor="#0058FF"
              color="white"
              fontSize="14px"
              fontWeight={600}
              lineHeight="21px"
              _hover={{ bg: "rgba(31, 90, 255, 0.15)" }}
            >
              <Link href={sellerHref}>
                {t("Marketplace.ctaBanner.sellerCta")}
              </Link>
            </Button>

            <Text
              fontSize="11px"
              lineHeight="16.5px"
              color="white"
              textAlign="center"
            >
              {t("Marketplace.ctaBanner.note")}
            </Text>
          </Stack>
        </Flex>
      </Box>
    </Box>
  );
}
