"use client";

import { Dialog, Flex, Icon, IconButton, Portal } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuX } from "react-icons/lu";

import {
  ProposalsDialogFooterProps,
  ProposalsDialogFrameProps,
} from "./interface";

// Botões do rodapé dos modais (Figma 2063-31417), lado a lado e de mesma
// largura.
const FOOTER_BUTTON = {
  flex: "1",
  minH: "50px",
  gap: "8px",
  rounded: "14px",
  fontSize: "14px",
  lineHeight: "21px",
} as const;

export const PROPOSALS_DIALOG_BUTTONS = {
  /** "Voltar", "Manter proposta": contorno cinza. */
  secondary: {
    ...FOOTER_BUTTON,
    variant: "plain",
    rounded: "16px",
    borderWidth: "1px",
    borderColor: "#E5E8EE",
    color: "#8A9AB5",
    fontWeight: 500,
    _hover: { bg: "#F4F6F9" },
  },
  primary: {
    ...FOOTER_BUTTON,
    bg: "#1F5AFF",
    color: "white",
    fontWeight: 700,
    _hover: { bg: "#1646CC" },
  },
  /** "Cancelar proposta" ao lado de outra ação: contorno vermelho. */
  dangerOutline: {
    ...FOOTER_BUTTON,
    variant: "plain",
    borderWidth: "1px",
    borderColor: "#FECACA",
    color: "#EF4444",
    fontWeight: 500,
    _hover: { bg: "#FEF2F2" },
  },
  /** Confirmação destrutiva. */
  danger: {
    ...FOOTER_BUTTON,
    bg: "#EF4444",
    color: "white",
    fontWeight: 700,
    _hover: { bg: "#DC2626" },
  },
} as const;

/** Linha de botões ao pé do modal, separada do conteúdo por uma linha. */
export function ProposalsDialogFooter({
  gap = "20px",
  children,
}: ProposalsDialogFooterProps) {
  return (
    <Flex
      gap={gap}
      mt="20px"
      pt="9px"
      borderTopWidth="1px"
      borderColor="#F4F6F9"
      direction={{ base: "column-reverse", sm: "row" }}
    >
      {children}
    </Flex>
  );
}

/**
 * Moldura dos modais de propostas e RFQ (Figma 2063-31324): título com linha
 * abaixo, fechar no canto e os botões de ação ao pé, separados por uma linha.
 */
export function ProposalsDialogFrame({
  open,
  title,
  onClose,
  isBusy = false,
  role = "dialog",
  closeTone = "plain",
  maxW = "672px",
  footer,
  children,
}: ProposalsDialogFrameProps) {
  const { t } = useTranslation();

  return (
    <Dialog.Root
      role={role}
      open={open}
      onOpenChange={(details) => {
        if (!details.open && !isBusy) onClose();
      }}
      scrollBehavior="inside"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxW={maxW}
            w="calc(100% - 32px)"
            bg="white"
            rounded="16px"
            overflow="hidden"
            boxShadow="0px 25px 50px -12px rgba(0,0,0,0.25)"
          >
            <Dialog.Header
              px="24px"
              pt="20px"
              pb="21px"
              pe="64px"
              borderBottomWidth="1px"
              borderColor="#E5E8EE"
            >
              <Dialog.Title
                color="#0F1729"
                fontSize="18px"
                fontWeight={700}
                lineHeight="27px"
              >
                {title}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body px="24px" py="20px">
              {children}
              {footer && (
                <ProposalsDialogFooter>{footer}</ProposalsDialogFooter>
              )}
            </Dialog.Body>

            <Dialog.CloseTrigger
              asChild
              top="20px"
              insetEnd="24px"
              disabled={isBusy}
            >
              <IconButton
                aria-label={t("Proposals.dialog.close")}
                variant="plain"
                boxSize="32px"
                minW="32px"
                rounded="10px"
                bg={closeTone === "filled" ? "#F4F6F9" : "transparent"}
                color="#5A6478"
                _hover={{ bg: "#F4F6F9" }}
              >
                <Icon as={LuX} boxSize="15px" />
              </IconButton>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
