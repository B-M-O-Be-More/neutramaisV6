"use client";

import { Icon, IconButton } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuCheck, LuCopy } from "react-icons/lu";

import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

import { CopyValueButtonProps } from "./interface";

/** Ícone de copiar ao lado de um valor (IDs, chaves); vira ✓ ao copiar. */
export function CopyValueButton({ value, label }: CopyValueButtonProps) {
  const { t } = useTranslation();
  const { status, copy } = useCopyToClipboard();
  const isCopied = status === "copied";

  return (
    <IconButton
      aria-label={t(isCopied ? "CopyValue.copied" : "CopyValue.copy", {
        label,
      })}
      variant="plain"
      boxSize="16px"
      minW="16px"
      h="16px"
      color={isCopied ? "#10B981" : "#A0ABB8"}
      _hover={{ color: isCopied ? "#10B981" : "#5A6478" }}
      onClick={() => copy(value)}
    >
      <Icon as={isCopied ? LuCheck : LuCopy} boxSize="12px" />
    </IconButton>
  );
}
