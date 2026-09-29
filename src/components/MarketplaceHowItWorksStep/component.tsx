"use client";

import { Flex, Icon, Stack, Text } from "@chakra-ui/react";

import {
  MarketplaceHowItWorksStepProps,
  MarketplaceHowItWorksStepTone,
} from "./interface";

// Paletas do design: o surface tinge o quadro e o accent pinta o ícone —
// as mesmas cores das categorias do marketplace.
const TONES: Record<
  MarketplaceHowItWorksStepTone,
  { surface: string; accent: string }
> = {
  blue: { surface: "#EEF3FF", accent: "#1F5AFF" },
  violet: { surface: "#F3EEFF", accent: "#8B5CF6" },
  emerald: { surface: "#EDFBF5", accent: "#10B981" },
  amber: { surface: "#FFFBEB", accent: "#F59E0B" },
};

/**
 * Etapa da seção "Como funciona" do marketplace.
 * Quadro com o ícone, marcador numerado e o texto da etapa, centralizados.
 */
export function MarketplaceHowItWorksStep({
  icon,
  step,
  title,
  description,
  tone,
}: MarketplaceHowItWorksStepProps) {
  const palette = TONES[tone];

  return (
    <Stack align="center" gap="12px" textAlign="center">
      <Flex
        align="center"
        justify="center"
        boxSize="64px"
        rounded="16px"
        bg={palette.surface}
        boxShadow="0px 1px 1.5px rgba(0, 0, 0, 0.1), 0px 1px 1px rgba(0, 0, 0, 0.1)"
      >
        <Icon as={icon} boxSize="20px" color={palette.accent} />
      </Flex>

      <Flex
        align="center"
        justify="center"
        boxSize="20px"
        rounded="full"
        bg="white"
        borderWidth="2px"
        borderColor="#E5E8EE"
      >
        <Text fontSize="10px" fontWeight={700} lineHeight="15px" color="#1F5AFF">
          {step}
        </Text>
      </Flex>

      <Stack gap="6px" maxW="270px">
        <Text
          as="h3"
          fontSize="14px"
          fontWeight={700}
          lineHeight="21px"
          color="#0F1729"
        >
          {title}
        </Text>
        <Text fontSize="12px" lineHeight="19.5px" color="#8A9AB5">
          {description}
        </Text>
      </Stack>
    </Stack>
  );
}
