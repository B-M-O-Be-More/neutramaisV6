"use client";

import TenantIcon from "@/components/TenantIcon";
import { Box, Flex, Grid, Icon, Image, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { CiLock, CiStar } from "react-icons/ci";
import { IoClipboardOutline } from "react-icons/io5";
import { LuShieldCheck } from "react-icons/lu";

// Destaques exibidos no painel de marca. Título/descrição vêm do i18n
// (AuthBrand.features.<key>); o ícone é decorativo e fica fixo aqui.
const FEATURES = [
  { key: "escrow", icon: CiLock },
  { key: "contract", icon: IoClipboardOutline },
  { key: "score", icon: CiStar },
  { key: "tenant", icon: TenantIcon },
] as const;

// Números ilustrativos (placeholder até virem métricas reais da plataforma).
// Só o rótulo é traduzido; o valor é meramente demonstrativo.
const STATS = [
  { value: "R$ 142M", labelKey: "AuthBrand.stats.transacted" },
  { value: "2.418", labelKey: "AuthBrand.stats.sellers" },
  { value: "98,2%", labelKey: "AuthBrand.stats.sla" },
] as const;

/**
 * Painel lateral de marca das telas de autenticação (login/registro).
 * Visível apenas em telas grandes (lg+); nas menores é ocultado e o
 * AuthLayout exibe um wordmark compacto no topo do formulário.
 */
export function AuthBrandPanel() {
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
            gap={2}
            w="fit-content"
            bg="rgba(31, 90, 255, 0.20)"
            borderWidth="1px"
            borderColor="rgba(31, 90, 255, 0.30)"
            rounded="full"
            px={3}
            py={1}
            mb={6}
          >
            <Icon as={LuShieldCheck} boxSize="12px" color="#1F5AFF" />
            <Text
              fontSize="11px"
              fontWeight={700}
              color="#1F5AFF"
              letterSpacing="0.5px"
            >
              {t("AuthBrand.badge")}
            </Text>
          </Flex>

          <Text
            color="white"
            fontSize="36px"
            fontWeight={800}
            lineHeight="1.15"
            mb={4}
          >
            {t("AuthBrand.headline")}
            <br />
            <Text as="span" color="#1F5AFF">
              {t("AuthBrand.headlineHighlight")}
            </Text>
          </Text>

          <Text color="#8A9AB5" fontSize="15px" lineHeight="1.6" mb="40px">
            {t("AuthBrand.subtitle")}
          </Text>

          <Stack gap={4}>
            {FEATURES.map((feature) => (
              <Flex key={feature.key} align="flex-start" gap={3}>
                <Flex
                  align="center"
                  justify="center"
                  boxSize="36px"
                  rounded="12px"
                  flexShrink={0}
                  bg="rgba(255, 255, 255, 0.05)"
                  borderWidth="1px"
                  borderColor="rgba(255, 255, 255, 0.10)"
                >
                  <Icon as={feature.icon} boxSize="16px" color="white" />
                </Flex>
                <Box>
                  <Text color="white" fontSize="13px" fontWeight={600}>
                    {t(`AuthBrand.features.${feature.key}.title`)}
                  </Text>
                  <Text color="#5A6478" fontSize="12px">
                    {t(`AuthBrand.features.${feature.key}.description`)}
                  </Text>
                </Box>
              </Flex>
            ))}
          </Stack>
        </Stack>

        {/* Estatísticas */}
        <Grid
          templateColumns="repeat(3, 1fr)"
          gap={4}
          pt="32px"
          borderTopWidth="1px"
          borderColor="rgba(255, 255, 255, 0.10)"
        >
          {STATS.map((stat) => (
            <Stack key={stat.labelKey} gap={0} textAlign="center">
              <Text color="#1F5AFF" fontSize="18px" fontWeight={800}>
                {stat.value}
              </Text>
              <Text color="#5A6478" fontSize="11px">
                {t(stat.labelKey)}
              </Text>
            </Stack>
          ))}
        </Grid>
      </Flex>
    </Flex>
  );
}
