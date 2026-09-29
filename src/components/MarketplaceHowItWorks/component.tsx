"use client";

import { Box, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  LuCreditCard,
  LuHeadphones,
  LuSearch,
  LuShieldCheck,
} from "react-icons/lu";

import MarketplaceHowItWorksStep from "@/components/MarketplaceHowItWorksStep";
import { MarketplaceHowItWorksStepTone } from "@/components/MarketplaceHowItWorksStep/interface";

import { MarketplaceHowItWorksStepKey } from "./interface";

// Etapas do fluxo de contratação, na ordem do design. Ícone e paleta ficam
// aqui; os textos vêm do i18n (Marketplace.howItWorks.steps.<key>).
const STEPS: {
  key: MarketplaceHowItWorksStepKey;
  icon: typeof LuSearch;
  tone: MarketplaceHowItWorksStepTone;
}[] = [
  { key: "search", icon: LuSearch, tone: "blue" },
  { key: "feasibility", icon: LuShieldCheck, tone: "violet" },
  { key: "escrow", icon: LuCreditCard, tone: "emerald" },
  { key: "tracking", icon: LuHeadphones, tone: "amber" },
];

/**
 * Seção "Como funciona" da home do marketplace.
 * Card institucional com selo, título e as quatro etapas do fluxo de
 * contratação, ligadas por uma linha no desktop.
 */
export function MarketplaceHowItWorks() {
  const { t } = useTranslation();

  return (
    // Mesmo respiro extra antes da seção usado nas demais seções da home.
    <Box pt={{ base: "20px", md: "44px" }}>
      <Stack
        as="section"
        align="center"
        gap="32px"
        p={{ base: "21px", md: "33px" }}
        bg="white"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="16px"
      >
        <Stack align="center" gap={0} textAlign="center">
          <Text
            mb="12px"
            px="12px"
            py="4px"
            rounded="full"
            bg="#EEF3FF"
            borderWidth="1px"
            borderColor="#C7D8FF"
            fontSize="11px"
            fontWeight={700}
            lineHeight="16.5px"
            color="#1F5AFF"
            textTransform="uppercase"
          >
            {t("Marketplace.howItWorks.badge")}
          </Text>
          <Text
            as="h2"
            fontSize={{ base: "20px", md: "24px" }}
            fontWeight={700}
            lineHeight={{ base: "30px", md: "36px" }}
            color="#0F1729"
          >
            {t("Marketplace.howItWorks.title")}
          </Text>
          <Text
            pt="8px"
            maxW="512px"
            fontSize="14px"
            lineHeight="21px"
            color="#8A9AB5"
          >
            {t("Marketplace.howItWorks.subtitle")}
          </Text>
        </Stack>

        <Box position="relative" w="full">
          {/* Linha que liga o centro do primeiro ao do último ícone. Fica atrás
              dos quadros (opacos) e some quando as etapas deixam de estar
              numa única linha. */}
          <Box
            display={{ base: "none", lg: "block" }}
            position="absolute"
            top="32px"
            left="12.5%"
            right="12.5%"
            h="1px"
            bg="#E5E8EE"
          />

          <SimpleGrid
            position="relative"
            columns={{ base: 1, sm: 2, lg: 4 }}
            gap={{ base: "28px", lg: "24px" }}
          >
            {STEPS.map((step, index) => {
              const base = `Marketplace.howItWorks.steps.${step.key}`;

              return (
                <MarketplaceHowItWorksStep
                  key={step.key}
                  icon={step.icon}
                  tone={step.tone}
                  step={index + 1}
                  title={t(`${base}.title`)}
                  description={t(`${base}.description`)}
                />
              );
            })}
          </SimpleGrid>
        </Box>
      </Stack>
    </Box>
  );
}
