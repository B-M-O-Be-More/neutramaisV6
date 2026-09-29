"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { DashboardQuickAccessCardProps } from "./interface";

/**
 * Atalho colorido do início da área autenticada: ícone, título e descrição
 * sobre um degradê, com contador opcional no canto.
 */
export function DashboardQuickAccessCard({
  href,
  title,
  description,
  icon,
  gradient,
  count,
}: DashboardQuickAccessCardProps) {
  const [from, to] = gradient;

  return (
    <Box
      asChild
      position="relative"
      display="block"
      h="118px"
      p="16px"
      overflow="hidden"
      rounded="14px"
      bgImage={`linear-gradient(155.59deg, ${from} 0%, ${to} 100%)`}
      transition="transform 0.15s, box-shadow 0.15s"
      _hover={{
        transform: "translateY(-2px)",
        boxShadow: "0px 8px 20px rgba(15,23,41,0.12)",
      }}
      _focusVisible={{ outline: "2px solid", outlineColor: from }}
    >
      <NextLink href={href}>
        {/* Círculo decorativo */}
        <Box
          position="absolute"
          top="-16px"
          right="-16px"
          boxSize="56px"
          rounded="full"
          bg="rgba(255,255,255,0.1)"
          pointerEvents="none"
        />

        {count ? (
          <Text
            as="span"
            position="absolute"
            top="16px"
            right="16px"
            px="6px"
            rounded="full"
            bg="rgba(255,255,255,0.3)"
            color="white"
            fontSize="10px"
            fontWeight={700}
            lineHeight="16px"
          >
            {count}
          </Text>
        ) : null}

        <Stack gap={0} color="white">
          <Flex
            boxSize="36px"
            align="center"
            justify="center"
            bg="rgba(255,255,255,0.2)"
            rounded="14px"
          >
            <Icon as={icon} boxSize="18px" />
          </Flex>
          <Text
            truncate
            pt="12px"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
          >
            {title}
          </Text>
          <Text
            truncate
            pt="2px"
            fontSize="11px"
            fontWeight={500}
            lineHeight="16.5px"
          >
            {description}
          </Text>
        </Stack>
      </NextLink>
    </Box>
  );
}
