"use client";

import { Flex, Icon, IconButton, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { LuChevronDown, LuX } from "react-icons/lu";

import { CollapsibleNoticeProps, CollapsibleNoticeTone } from "./interface";

// Azul: "Como funcionam" das propostas (Figma 2073-38659). Roxo: central de
// suporte (Figma 3108-101443).
const TONES: Record<
  CollapsibleNoticeTone,
  {
    bg: string;
    border: string;
    accent: string;
    text: string;
    dismiss: string;
    hover: string;
    radius: string;
    iconRadius: string;
    iconSize: string;
  }
> = {
  blue: {
    bg: "#EEF3FF",
    border: "#C7D8FF",
    accent: "#1F5AFF",
    text: "#3B5FBF",
    dismiss: "#8A9AB5",
    hover: "rgba(31,90,255,0.08)",
    radius: "14px",
    iconRadius: "10px",
    iconSize: "15px",
  },
  purple: {
    bg: "#F3EEFF",
    border: "#D3BFFD",
    accent: "#8B5CF6",
    text: "#5B21B6",
    dismiss: "#A0ABB8",
    hover: "rgba(139,92,246,0.08)",
    radius: "12px",
    iconRadius: "8px",
    iconSize: "14px",
  },
};

/**
 * Faixa explicativa no topo de uma página: ícone, título e texto. A seta
 * recolhe o texto; o X fecha a faixa.
 */
export function CollapsibleNotice({
  tone,
  icon,
  title,
  description,
  labels,
  onDismiss,
}: CollapsibleNoticeProps) {
  const colors = TONES[tone];
  const [isExpanded, setExpanded] = React.useState(true);
  const descriptionId = React.useId();

  return (
    <Flex
      as="section"
      aria-label={typeof title === "string" ? title : undefined}
      gap="12px"
      align="flex-start"
      px="21px"
      py="17px"
      bg={colors.bg}
      borderWidth="1px"
      borderColor={colors.border}
      rounded={colors.radius}
    >
      <Flex
        align="center"
        justify="center"
        boxSize="32px"
        flexShrink={0}
        bg={colors.bg}
        borderWidth="1px"
        borderColor={colors.border}
        rounded={colors.iconRadius}
      >
        <Icon
          as={icon}
          boxSize={colors.iconSize}
          color={colors.accent}
          aria-hidden
        />
      </Flex>

      <Stack gap="2px" flex="1" minW={0}>
        <Text
          color={colors.accent}
          fontSize="13px"
          fontWeight={700}
          lineHeight="19.5px"
        >
          {title}
        </Text>
        {isExpanded && (
          <Text
            id={descriptionId}
            color={colors.text}
            fontSize="12px"
            lineHeight="18px"
          >
            {description}
          </Text>
        )}
      </Stack>

      <Flex gap="4px" flexShrink={0}>
        <IconButton
          aria-label={isExpanded ? labels.collapse : labels.expand}
          aria-expanded={isExpanded}
          aria-controls={isExpanded ? descriptionId : undefined}
          variant="plain"
          boxSize="22px"
          minW="22px"
          rounded="4px"
          color={colors.accent}
          _hover={{ bg: colors.hover }}
          onClick={() => setExpanded((current) => !current)}
        >
          <Icon
            as={LuChevronDown}
            boxSize="14px"
            transform={isExpanded ? undefined : "rotate(-90deg)"}
            transition="transform 0.15s"
          />
        </IconButton>
        <IconButton
          aria-label={labels.dismiss}
          variant="plain"
          boxSize="22px"
          minW="22px"
          rounded="4px"
          color={colors.dismiss}
          _hover={{ bg: colors.hover }}
          onClick={onDismiss}
        >
          <Icon as={LuX} boxSize="13px" />
        </IconButton>
      </Flex>
    </Flex>
  );
}
