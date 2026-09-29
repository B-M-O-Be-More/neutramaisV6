"use client";

import {
  Box,
  Flex,
  Icon,
  LinkBox,
  LinkOverlay,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { LuArrowRight } from "react-icons/lu";

import {
  MarketplaceCategoryCardProps,
  MarketplaceCategoryTone,
} from "./interface";

// Paletas do design: fundo e borda tingem o card e o quadro do ícone; o accent
// pinta o ícone e o selo.
const TONES: Record<
  MarketplaceCategoryTone,
  { surface: string; border: string; accent: string }
> = {
  blue: { surface: "#EEF3FF", border: "#C7D8FF", accent: "#1F5AFF" },
  violet: { surface: "#F3EEFF", border: "#D3BFFD", accent: "#8B5CF6" },
  emerald: { surface: "#EDFBF5", border: "#AAECD5", accent: "#10B981" },
  amber: { surface: "#FFFBEB", border: "#FDE68A", accent: "#F59E0B" },
};

/**
 * Card genérico de categoria do marketplace.
 * Card inteiro clicável, com ícone, selo opcional, resumo, chips de tipos de
 * oferta e um rodapé com a contagem — reaproveitado por todas as categorias.
 */
export function MarketplaceCategoryCard({
  icon,
  title,
  description,
  tags,
  footerLabel,
  tone,
  href,
  badge,
  isLoading = false,
}: MarketplaceCategoryCardProps) {
  const palette = TONES[tone];

  return (
    <LinkBox
      as="article"
      h="full"
      bg={palette.surface}
      borderWidth="1px"
      borderColor={palette.border}
      rounded="14px"
      transition="border-color 0.15s ease"
      _hover={{ borderColor: palette.accent }}
    >
      <Stack h="full" gap="12px" p="21px">
        <Flex align="flex-start" justify="space-between" gap="8px">
          <Flex
            align="center"
            justify="center"
            boxSize="44px"
            flexShrink={0}
            rounded="14px"
            bg={palette.surface}
            borderWidth="1px"
            borderColor={palette.border}
          >
            <Icon as={icon} boxSize="22px" color={palette.accent} />
          </Flex>

          {badge ? (
            <Text
              flexShrink={0}
              px="8px"
              py="2px"
              rounded="full"
              bg={palette.accent}
              color="white"
              fontSize="10px"
              fontWeight={700}
              lineHeight="15px"
            >
              {badge}
            </Text>
          ) : null}
        </Flex>

        <Box>
          <LinkOverlay asChild>
            <Link href={href}>
              <Text
                fontSize="15px"
                fontWeight={700}
                lineHeight="22.5px"
                color="#0F1729"
              >
                {title}
              </Text>
            </Link>
          </LinkOverlay>
          <Text
            pt="4px"
            fontSize="12px"
            fontWeight={500}
            lineHeight="19.5px"
            color="#5A6478"
          >
            {description}
          </Text>
        </Box>

        <Flex wrap="wrap" gap="4px">
          {tags.map((tag) => (
            <Text
              key={tag}
              px="9px"
              py="3px"
              rounded="8px"
              bg="rgba(255, 255, 255, 0.7)"
              borderWidth="1px"
              borderColor="rgba(255, 255, 255, 0.8)"
              fontSize="11px"
              fontWeight={500}
              lineHeight="16.5px"
              color="#5A6478"
            >
              {tag}
            </Text>
          ))}
        </Flex>

        {/* `mt="auto"` alinha o rodapé na base, mantendo os cards da linha
            com a mesma altura mesmo com descrições de tamanhos diferentes. */}
        <Flex
          mt="auto"
          pt="9px"
          align="center"
          justify="space-between"
          gap="8px"
          borderTopWidth="1px"
          borderColor="rgba(255, 255, 255, 0.5)"
        >
          {isLoading ? (
            <Skeleton h="18px" w="80px" rounded="6px" />
          ) : (
            <Text
              fontSize="12px"
              fontWeight={600}
              lineHeight="18px"
              color="#5A6478"
            >
              {footerLabel}
            </Text>
          )}
          <Icon as={LuArrowRight} boxSize="14px" color="#A0ABB8" />
        </Flex>
      </Stack>
    </LinkBox>
  );
}
