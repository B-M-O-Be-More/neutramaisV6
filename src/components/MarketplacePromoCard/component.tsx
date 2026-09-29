"use client";

import { Flex, Icon, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { LuArrowRight } from "react-icons/lu";

import { MarketplacePromoCardProps, MarketplacePromoTone } from "./interface";

// Paletas do design: o gradiente pinta o card e o accent, o texto do botão.
const TONES: Record<MarketplacePromoTone, { gradient: string; accent: string }> =
  {
    blue: {
      gradient: "linear-gradient(90deg, #1F5AFF 0%, #6B9FFF 100%)",
      accent: "#1F5AFF",
    },
    violet: {
      gradient: "linear-gradient(90deg, #8B5CF6 0%, #C084FC 100%)",
      accent: "#8B5CF6",
    },
    emerald: {
      gradient: "linear-gradient(90deg, #10B981 0%, #34D399 100%)",
      accent: "#10B981",
    },
  };

/**
 * Card promocional do marketplace.
 * Fundo em gradiente com ícone, selo, chamada, condições e um botão de ação —
 * reaproveitado por todas as campanhas da seção de preços públicos.
 */
export function MarketplacePromoCard({
  icon,
  badge,
  title,
  description,
  ctaLabel,
  href,
  tone,
}: MarketplacePromoCardProps) {
  const palette = TONES[tone];

  return (
    <Stack
      as="article"
      h="full"
      gap="8px"
      px="20px"
      py="16px"
      rounded="14px"
      bgImage={palette.gradient}
      color="white"
    >
      <Flex align="center" gap="8px">
        <Flex
          align="center"
          justify="center"
          boxSize="28px"
          flexShrink={0}
          rounded="10px"
          bg="rgba(255, 255, 255, 0.2)"
        >
          <Icon as={icon} boxSize="18px" color="white" />
        </Flex>

        <Text
          px="8px"
          py="2px"
          rounded="full"
          bg="rgba(255, 255, 255, 0.2)"
          fontSize="9px"
          fontWeight={700}
          lineHeight="13.5px"
          textTransform="uppercase"
        >
          {badge}
        </Text>
      </Flex>

      <Text as="h3" fontSize="14px" fontWeight={700} lineHeight="21px">
        {title}
      </Text>

      <Text
        fontSize="11px"
        lineHeight="16.5px"
        color="rgba(255, 255, 255, 0.75)"
      >
        {description}
      </Text>

      {/* `mt="auto"` alinha o botão na base quando os textos quebram em
          tamanhos diferentes entre os cards da linha. */}
      <Flex mt="auto">
        <Link href={href}>
          <Flex
            align="center"
            gap="4px"
            px="12px"
            py="6px"
            rounded="10px"
            bg="white"
            color={palette.accent}
            transition="opacity 0.15s ease"
            _hover={{ opacity: 0.9 }}
          >
            <Text fontSize="12px" fontWeight={700} lineHeight="18px">
              {ctaLabel}
            </Text>
            <Icon as={LuArrowRight} boxSize="12px" />
          </Flex>
        </Link>
      </Flex>
    </Stack>
  );
}
