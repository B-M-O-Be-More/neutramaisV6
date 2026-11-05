"use client";

import { Button, Icon } from "@chakra-ui/react";
import NextLink from "next/link";

import {
  ContractActionButtonProps,
  ContractActionButtonTone,
} from "./interface";

// Botões de ação do contrato (Figma 2084-12138 e 2190-14387).
const TONES: Record<
  ContractActionButtonTone,
  {
    bg: string;
    border: string;
    color: string;
    fontWeight: number;
    hoverBg: string;
  }
> = {
  primary: {
    bg: "#F3EEFF",
    border: "#D3BFFD",
    color: "#8B5CF6",
    fontWeight: 600,
    hoverBg: "#EAE1FF",
  },
  neutral: {
    bg: "white",
    border: "#E5E8EE",
    color: "#5A6478",
    fontWeight: 500,
    hoverBg: "#F8F9FB",
  },
  danger: {
    bg: "white",
    border: "#FECACA",
    color: "#EF4444",
    fontWeight: 500,
    hoverBg: "#FEF2F2",
  },
};

/**
 * Ação de um contrato: assinar, baixar o PDF, ver o detalhe. `block` ocupa a
 * largura toda (card "Ações" do detalhe).
 */
export function ContractActionButton({
  tone,
  icon,
  href,
  block = false,
  children,
  ...rest
}: ContractActionButtonProps) {
  const colors = TONES[tone];
  const content = (
    <>
      {icon && <Icon as={icon} boxSize="13px" aria-hidden />}
      {children}
    </>
  );

  return (
    <Button
      variant="plain"
      w={block ? "full" : undefined}
      h={block ? "41px" : "auto"}
      px="13px"
      py={block ? 0 : "9px"}
      gap="6px"
      bg={colors.bg}
      borderWidth="1px"
      borderColor={colors.border}
      rounded={block ? "13px" : "10px"}
      color={colors.color}
      fontSize="13px"
      fontWeight={colors.fontWeight}
      lineHeight="19.5px"
      _hover={{ bg: colors.hoverBg }}
      asChild={!!href}
      {...rest}
    >
      {href ? <NextLink href={href}>{content}</NextLink> : content}
    </Button>
  );
}
