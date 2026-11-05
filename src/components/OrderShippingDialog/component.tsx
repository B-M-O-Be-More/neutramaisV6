"use client";

import { Dialog, Icon, IconButton, Portal } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuX } from "react-icons/lu";

import { OrderShippingDialogProps } from "./interface";

/**
 * Moldura dos modais de envio do Seller (anexar NF, informar rastreio), no
 * mesmo visual do "Pedir complemento". O formulário traz corpo e rodapé.
 */
export function OrderShippingDialog({
  open,
  title,
  description,
  isPending,
  maxW = "513px",
  onClose,
  children,
}: OrderShippingDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open && !isPending) onClose();
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
              flexDirection="column"
              alignItems="flex-start"
              gap="2px"
              px="24px"
              py="20px"
              pe="64px"
              borderBottomWidth="1px"
              borderColor="#F4F6F9"
            >
              <Dialog.Title
                color="#0F1729"
                fontSize="16px"
                fontWeight={800}
                lineHeight="24px"
              >
                {title}
              </Dialog.Title>
              <Dialog.Description
                color="#8A9AB5"
                fontSize="12px"
                lineHeight="18px"
              >
                {description}
              </Dialog.Description>
            </Dialog.Header>

            <Dialog.Body p={0}>{children}</Dialog.Body>

            <Dialog.CloseTrigger
              asChild
              top="24px"
              insetEnd="20px"
              disabled={isPending}
            >
              <IconButton
                aria-label={t("OrderShipping.close")}
                variant="plain"
                boxSize="32px"
                minW="32px"
                rounded="8px"
                color="#8A9AB5"
                _hover={{ bg: "#F4F6F9" }}
              >
                <Icon as={LuX} boxSize="16px" />
              </IconButton>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
