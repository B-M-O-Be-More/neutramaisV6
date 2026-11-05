"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { LuStar } from "react-icons/lu";

import { OFFER_CATEGORY_PALETTE } from "@/components/MarketplaceOfferCard/categories";
import type { OfferCoverKind } from "@/types/offers";

import { OfferCoverProps } from "./interface";

// Azul das ofertas de conectividade, verde das de hardware e das
// personalizadas (Figma 2084-20392 e 2084-20646).
const GRADIENTS: Record<OfferCoverKind, string> = {
  connectivity: OFFER_CATEGORY_PALETTE.connectivity.gradient,
  hardware: OFFER_CATEGORY_PALETTE.hardware.gradient,
  forYou: OFFER_CATEGORY_PALETTE.hardware.gradient,
};

/** Capa de 100px dos cards da vitrine (Figma 2084-20390). */
export function OfferCover({
  kind,
  badge,
  caption,
  icon,
  sponsoredLabel,
  discountLabel,
}: OfferCoverProps) {
  return (
    <Box
      position="relative"
      h="100px"
      overflow="hidden"
      bgImage={GRADIENTS[kind]}
    >
      <Box
        aria-hidden
        position="absolute"
        top="-24px"
        right="-24px"
        boxSize="80px"
        rounded="full"
        bg="rgba(255,255,255,0.1)"
      />
      <Box
        aria-hidden
        position="absolute"
        top="60px"
        left="-16px"
        boxSize="56px"
        rounded="full"
        bg="rgba(255,255,255,0.1)"
      />
      <Box
        aria-hidden
        position="absolute"
        insetX={0}
        bottom={0}
        h="32px"
        bgImage="linear-gradient(to top, rgba(0,0,0,0.2), transparent)"
      />

      <Stack
        position="absolute"
        inset={0}
        align="center"
        justify="center"
        gap="4px"
        pt="8px"
      >
        {icon ? (
          <>
            <Icon
              as={icon}
              boxSize="28px"
              color="rgba(255,255,255,0.6)"
              aria-hidden
            />
            <Text
              color="rgba(255,255,255,0.5)"
              fontSize="10px"
              fontWeight={600}
              lineHeight="15px"
              letterSpacing="0.4px"
            >
              {caption}
            </Text>
          </>
        ) : (
          <Text
            color="white"
            fontSize="13px"
            fontWeight={600}
            lineHeight="19.5px"
          >
            {caption}
          </Text>
        )}
      </Stack>

      <Text
        position="absolute"
        top="8px"
        left="8px"
        px="9px"
        py="2px"
        bg="rgba(255,255,255,0.2)"
        borderWidth="1px"
        borderColor="rgba(255,255,255,0.3)"
        rounded="full"
        color="white"
        fontSize="10px"
        fontWeight={700}
        lineHeight="15px"
      >
        {badge}
      </Text>

      {(sponsoredLabel || discountLabel) && (
        <Flex position="absolute" top="8px" right="8px" gap="4px">
          {sponsoredLabel && (
            <Flex
              align="center"
              gap="3px"
              px="6px"
              py="1px"
              bg="rgba(255,255,255,0.95)"
              rounded="8px"
              color="#1F5AFF"
              fontSize="9px"
              fontWeight={700}
              lineHeight="13px"
            >
              <Icon
                as={LuStar}
                boxSize="10px"
                color="#F59E0B"
                fill="#F59E0B"
                aria-hidden
              />
              {sponsoredLabel}
            </Flex>
          )}
          {discountLabel && (
            <Text
              px="8px"
              py="2px"
              bg="#10B981"
              rounded="8px"
              color="white"
              fontSize="10px"
              fontWeight={700}
              lineHeight="15px"
            >
              {discountLabel}
            </Text>
          )}
        </Flex>
      )}
    </Box>
  );
}
