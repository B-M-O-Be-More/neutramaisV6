"use client";

import { Box, Flex, Icon, Image, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LuClock, LuKeyRound, LuLock, LuShieldCheck } from "react-icons/lu";

// Garantias de segurança exibidas na barra lateral. O texto vem do i18n
// (ForgotPassword.sidebar.features.<key>); o ícone fica fixo aqui.
const FEATURES = [
  { key: "expiry", icon: LuClock },
  { key: "corporate", icon: LuShieldCheck },
  { key: "strength", icon: LuLock },
] as const;

/**
 * Barra lateral da tela de recuperação de senha. Substitui o AuthBrandPanel de
 * marketing nesta página: em vez dos destaques da plataforma, reforça as
 * garantias de segurança do fluxo de redefinição. Visível apenas em telas
 * grandes (lg+) — nas menores o AuthLayout exibe o wordmark compacto.
 */
export function ForgotPasswordSidebar() {
  const { t } = useTranslation();

  return (
    <Flex
      display={{ base: "none", lg: "flex" }}
      w={{ lg: "480px", xl: "560px" }}
      flexShrink={0}
      direction="column"
      position="relative"
      overflow="hidden"
      bgImage="linear-gradient(to bottom right, #0F1729, #1A2540, #0D1220)"
    >
      {/* Decorações de fundo */}
      <Box
        position="absolute"
        top="0"
        right="0"
        boxSize="320px"
        rounded="full"
        bg="rgba(31, 90, 255, 0.10)"
        transform="translate(80px, -80px)"
      />
      <Box
        position="absolute"
        bottom="0"
        left="0"
        boxSize="256px"
        rounded="full"
        bg="rgba(139, 92, 246, 0.10)"
        transform="translate(-64px, 64px)"
      />

      <Flex direction="column" position="relative" h="full" px="48px" py="48px">
        {/* Logo */}
        <Flex align="center" mb="64px">
          <Image
            src="/assets/logo.png"
            alt={t("AuthBrand.logoAlt")}
            h="45px"
            w="243px"
            objectFit="contain"
          />
        </Flex>

        {/* Headline */}
        <Stack flex="1" justify="center" gap={0}>
          <Flex
            align="center"
            justify="center"
            boxSize="48px"
            rounded="14px"
            flexShrink={0}
            mb={6}
            bg="rgba(31, 90, 255, 0.15)"
            borderWidth="1px"
            borderColor="rgba(31, 90, 255, 0.30)"
          >
            <Icon as={LuKeyRound} boxSize="22px" color="#1F5AFF" />
          </Flex>

          <Text
            color="white"
            fontSize="26px"
            fontWeight={800}
            lineHeight="1.25"
          >
            {t("ForgotPassword.sidebar.headline")}
            <br />
            <Text as="span" color="brand.500">
              {t("ForgotPassword.sidebar.headlineHighlight")}
            </Text>
          </Text>

          <Text
            color="#8A9AB5"
            fontSize="14px"
            lineHeight="1.6"
            mt={3}
            mb="32px"
          >
            {t("ForgotPassword.sidebar.subtitle")}
          </Text>

          <Stack gap={4}>
            {FEATURES.map((feature) => (
              <Flex key={feature.key} align="center" gap={3}>
                <Flex
                  align="center"
                  justify="center"
                  boxSize="32px"
                  rounded="10px"
                  flexShrink={0}
                  bg="rgba(255, 255, 255, 0.05)"
                  borderWidth="1px"
                  borderColor="rgba(255, 255, 255, 0.10)"
                >
                  <Icon as={feature.icon} boxSize="14px" color="#8A9AB5" />
                </Flex>
                <Text color="#98A6B3" fontSize="13px">
                  {t(`ForgotPassword.sidebar.features.${feature.key}`)}
                </Text>
              </Flex>
            ))}
          </Stack>
        </Stack>

        {/* Rodapé */}
        <Box
          mt="32px"
          pt="25px"
          borderTopWidth="1px"
          borderColor="rgba(255, 255, 255, 0.10)"
        >
          <Text fontSize="12px" color="#5A6478">
            {t("ForgotPassword.sidebar.support")}{" "}
            <Link
              href={`mailto:${t("ForgotPassword.sidebar.supportEmail")}`}
              style={{ color: "#1F5AFF", fontWeight: 600 }}
            >
              {t("ForgotPassword.sidebar.supportEmail")}
            </Link>
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
}
