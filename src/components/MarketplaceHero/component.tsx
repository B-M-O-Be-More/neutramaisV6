"use client";

import { Button, Flex, Icon, Image, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  LuArrowRight,
  LuClock,
  LuSearch,
  LuShieldCheck,
  LuStar,
} from "react-icons/lu";

// Selos de confiança do rodapé do banner. O texto vem do i18n
// (Marketplace.hero.trust.<key>); ícone e cor ficam fixos aqui.
const TRUST_BADGES = [
  { key: "escrow", icon: LuShieldCheck, color: "#10B981", filled: false },
  { key: "score", icon: LuStar, color: "#D29922", filled: true },
  { key: "sla", icon: LuClock, color: "#1F5AFF", filled: false },
] as const;

// Painel azul: no desktop entra pela direita como fade horizontal; no mobile
// vira uma faixa abaixo do conteúdo, onde o fade horizontal não faria sentido.
const PANEL_GRADIENT =
  "linear-gradient(90deg, rgba(31, 90, 255, 0) 0%, rgba(31, 90, 255, 0.26) 19.381%, rgb(31, 90, 255) 84.534%)";
const PANEL_GRADIENT_MOBILE =
  "linear-gradient(180deg, rgba(31, 90, 255, 0.85) 0%, rgb(31, 90, 255) 100%)";

// Proporção do wordmark (522.758 x 125 no Figma). Mantém a geometria original
// enquanto a largura acompanha o painel de forma fluida.
const WORDMARK_RATIO = 522.758 / 125;

/**
 * Banner principal da home pública do marketplace: proposta de valor, chamadas
 * para explorar o catálogo / criar conta e os selos de confiança.
 * A partir de `lg` o painel de marca ocupa a metade direita do card; abaixo
 * disso ele desce para uma faixa de largura total, sob o conteúdo.
 */
export function MarketplaceHero() {
  const { t } = useTranslation();

  return (
    <Flex
      direction="column"
      position="relative"
      w="full"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="16px"
      overflow="hidden"
    >
      {/* Painel de marca — metade direita no desktop, faixa no mobile.
          O `order` só vale no mobile: a partir de `lg` o painel é absoluto e
          sai do fluxo, então a ordem no DOM deixa de importar. */}
      <Flex
        order={{ base: 1, lg: 0 }}
        position={{ base: "static", lg: "absolute" }}
        top="0"
        right="0"
        bottom="0"
        w={{ base: "full", lg: "48.93%" }}
        align="center"
        justify={{ base: "center", lg: "flex-start" }}
        ps={{ base: "24px", lg: "36px", xl: "49px" }}
        pe="24px"
        py={{ base: "32px", lg: 0 }}
        bgImage={{ base: PANEL_GRADIENT_MOBILE, lg: PANEL_GRADIENT }}
      >
        <Image
          src="/assets/logo-wordmark-white.svg"
          alt={t("Marketplace.hero.logoAlt")}
          objectFit="contain"
          w="full"
          maxW="522.758px"
          aspectRatio={WORDMARK_RATIO}
        />
      </Flex>

      {/* Conteúdo (esquerda) */}
      <Stack
        position="relative"
        maxW={{ base: "full", lg: "672px" }}
        px={{ base: 6, md: "40px" }}
        py={{ base: 10, md: "48px" }}
        gap={0}
      >
        <Flex
          align="center"
          gap="8px"
          w="fit-content"
          bg="#EEF3FF"
          borderWidth="1px"
          borderColor="#C7D8FF"
          rounded="full"
          px="13px"
          py="5px"
        >
          <Icon as={LuShieldCheck} boxSize="11px" color="#1F5AFF" />
          <Text
            fontSize="11px"
            fontWeight={700}
            lineHeight="16.5px"
            color="#1F5AFF"
          >
            {t("Marketplace.hero.badge")}
          </Text>
        </Flex>

        <Text
          as="h1"
          mt="23.5px"
          fontSize={{ base: "28px", md: "38px" }}
          fontWeight={800}
          lineHeight="1.15"
          color="#0F1729"
        >
          {t("Marketplace.hero.headline")}
          <br />
          <Text as="span" color="#1F5AFF">
            {t("Marketplace.hero.headlineHighlight")}
          </Text>
        </Text>

        <Text
          mt="16px"
          maxW="592px"
          fontSize="15px"
          lineHeight="24.375px"
          color="#5A6478"
        >
          {t("Marketplace.hero.subtitle")}
        </Text>

        <Flex mt="32px" align="center" gap="12px" wrap="wrap">
          <Button
            asChild
            h="45px"
            px="24px"
            gap="8px"
            rounded="14px"
            bg="#1F5AFF"
            color="white"
            fontSize="14px"
            fontWeight={700}
            boxShadow="0px 4px 3px rgba(0, 0, 0, 0.1), 0px 2px 2px rgba(0, 0, 0, 0.1)"
            _hover={{ bg: "#1849CC" }}
          >
            <Link href="/marketplace">
              <Icon as={LuSearch} boxSize="15px" />
              {t("Marketplace.hero.exploreCta")}
            </Link>
          </Button>

          <Button
            asChild
            variant="plain"
            h="47px"
            px="25px"
            gap="8px"
            rounded="14px"
            bg="#EEF3FF"
            borderWidth="1px"
            borderColor="#C7D8FF"
            color="#1F5AFF"
            fontSize="14px"
            fontWeight={600}
            _hover={{ bg: "#E1EAFF" }}
          >
            <Link href="/register">
              {t("Marketplace.hero.registerCta")}
              <Icon as={LuArrowRight} boxSize="15px" />
            </Link>
          </Button>
        </Flex>

        <Flex
          mt="32px"
          pt="25px"
          align="center"
          gap="20px"
          wrap="wrap"
          borderTopWidth="1px"
          borderColor="#E5E8EE"
        >
          {TRUST_BADGES.map((badge) => (
            <Flex key={badge.key} align="center" gap="6px">
              <Icon
                as={badge.icon}
                boxSize="13px"
                color={badge.color}
                fill={badge.filled ? badge.color : "none"}
              />
              <Text fontSize="12px" lineHeight="18px" color="#5A6478">
                {t(`Marketplace.hero.trust.${badge.key}`)}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Stack>
    </Flex>
  );
}
