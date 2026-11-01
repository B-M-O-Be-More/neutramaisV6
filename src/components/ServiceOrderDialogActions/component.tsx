"use client";

import { Button, Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { ServiceOrderDialogActionsProps } from "./interface";

/**
 * Rodapé dos modais das ordens de serviço (Figma 2968-68449): "Cancelar" e a
 * ação principal à direita, abaixo de uma linha.
 */
export function ServiceOrderDialogActions({
  confirmLabel,
  isSubmitting = false,
  confirmDisabled = false,
  onCancel,
  onConfirm,
}: ServiceOrderDialogActionsProps) {
  const { t } = useTranslation();

  return (
    <Flex
      justify="flex-end"
      gap="8px"
      pt="16px"
      borderTopWidth="1px"
      borderColor="#F4F6F9"
    >
      <Button
        type="button"
        variant="plain"
        h="40px"
        px="16px"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="8px"
        color="#5A6478"
        fontSize="12px"
        fontWeight={600}
        _hover={{ bg: "#F4F6F9" }}
        disabled={isSubmitting}
        onClick={onCancel}
      >
        {t("ServiceOrders.dialog.cancel")}
      </Button>
      <Button
        type={onConfirm ? "button" : "submit"}
        h="40px"
        px="20px"
        bg="#1F5AFF"
        rounded="8px"
        color="white"
        fontSize="12px"
        fontWeight={700}
        _hover={{ bg: "#1646CC" }}
        _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
        loading={isSubmitting}
        disabled={confirmDisabled}
        onClick={onConfirm}
      >
        {confirmLabel}
      </Button>
    </Flex>
  );
}
