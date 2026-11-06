"use client";

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuBuilding2, LuShoppingCart } from "react-icons/lu";

import { s } from "@/components/MarketplaceCatalog/scale";

import { MarketplaceBuyerCardProps } from "./interface";

const BACKGROUND_GRADIENT =
  "linear-gradient(154.57deg, #1F5AFF 0%, #1E57F8 7.143%, #1C54F0 14.286%, #1B51E9 21.429%, #1A4EE2 28.571%, #194CDA 35.714%, #1749D3 42.857%, #1646CC 50%, #1442C2 57.143%, #133EB9 64.286%, #113AAF 71.429%, #1036A6 78.571%, #0E329C 85.714%, #0D2E93 92.857%, #0B2A8A 100%)";

/**
 * Card de conversão para quem compra no marketplace.
 * Fundo azul com ícone decorativo de carrinho e dois atalhos: cadastro
 * (ação principal) e catálogo público.
 *
 * Medidas do Figma (nó 3300:58902) escritas na base de `s()`: valem 1:1 a
 * partir de 1536px e reduzidas abaixo disso.
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
      rounded={s(24)}
      h="full"
      minH={{ md: s(343.05) }}
      display="flex"
      flexDirection="column"
      pt={{ base: s(28), md: s(40) }}
      pb={{ base: s(28), md: s(42) }}
      px={{ base: s(24), md: s(40) }}
      bgImage={BACKGROUND_GRADIENT}
      color="white"
    >
      {/* Anéis e carrinho decorativos no canto superior direito. */}
      <Box
        aria-hidden
        position="absolute"
        top={s(-64)}
        right={s(-64)}
        boxSize={s(288)}
        rounded="full"
        borderWidth={s(1)}
        borderColor="rgba(255, 255, 255, 0.15)"
      />
      <Box
        aria-hidden
        position="absolute"
        top={s(24)}
        right={s(-24)}
        boxSize={s(192)}
        rounded="full"
        borderWidth={s(1)}
        borderColor="rgba(255, 255, 255, 0.2)"
      />
      {/* Círculo preenchido na parte inferior direita. */}
      <Box
        aria-hidden
        position="absolute"
        top={s(199.06)}
        right={s(40)}
        boxSize={s(112)}
        rounded="full"
        bg="rgba(255, 255, 255, 0.1)"
      />
      <Icon
        aria-hidden
        as={LuShoppingCart}
        position="absolute"
        top={s(40)}
        right={s(32)}
        boxSize={s(120)}
        color="rgba(255, 255, 255, 0.1)"
      />

      <Stack position="relative" gap={0} maxW={s(448)} align="flex-start">
        <Flex
          align="center"
          gap={s(6)}
          h={s(24.5)}
          mb={s(20)}
          px={s(12)}
          py={s(4)}
          rounded="full"
          bg="rgba(255, 255, 255, 0.15)"
          fontSize={s(11)}
          fontWeight={700}
          lineHeight={s(16.5)}
          textTransform="uppercase"
          whiteSpace="nowrap"
        >
          <Icon as={LuBuilding2} boxSize={s(12)} />
          {t("Marketplace.catalog.buyer.badge")}
        </Flex>

        <Text
          as="h3"
          fontSize={{ base: s(26), md: s(34) }}
          fontWeight={800}
          lineHeight={{ base: s(30), md: s(37.4) }}
        >
          {t("Marketplace.catalog.buyer.title")}
        </Text>

        <Text
          pt={s(16)}
          fontSize={s(14)}
          lineHeight={s(22.4)}
          color="rgba(255, 255, 255, 0.8)"
        >
          {t("Marketplace.catalog.buyer.description")}
        </Text>
      </Stack>

      <Flex position="relative" gap={s(12)} mt="auto" pt={s(32)} wrap="wrap">
        <Button
          asChild
          variant="plain"
          h="auto"
          px={s(24)}
          py={s(14)}
          gap={s(8)}
          rounded={s(14)}
          bg="white"
          color="#1F5AFF"
          fontSize={s(14)}
          fontWeight={700}
          lineHeight={s(21)}
          filter={`drop-shadow(0 ${s(10)} ${s(7.5)} rgba(0, 0, 0, 0.1)) drop-shadow(0 ${s(4)} ${s(3)} rgba(0, 0, 0, 0.1))`}
          _hover={{ bg: "rgba(255, 255, 255, 0.9)" }}
        >
          <Link href={href}>
            {t("Marketplace.catalog.buyer.primaryCta")}
            <Icon as={LuArrowRight} boxSize={s(15)} />
          </Link>
        </Button>

        <Button
          asChild
          variant="plain"
          h="auto"
          px={s(20)}
          py={s(14)}
          rounded={s(14)}
          borderWidth={s(1)}
          borderColor="rgba(255, 255, 255, 0.3)"
          color="white"
          fontSize={s(14)}
          fontWeight={600}
          lineHeight={s(21)}
          _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
        >
          <Link href={catalogHref}>
            {t("Marketplace.catalog.buyer.secondaryCta")}
          </Link>
        </Button>
      </Flex>
    </Box>
  );
}
