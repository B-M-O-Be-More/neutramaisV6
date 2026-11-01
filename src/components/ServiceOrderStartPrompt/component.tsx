"use client";

import { Button, Dialog, Flex, Portal, Stack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { ServiceOrderStartPromptProps } from "./interface";

/**
 * "Ações — Deseja iniciar agora?" (Figma 2968-72899): depois de escolher o
 * técnico de uma OS pendente, só adiciona ou já inicia a execução.
 */
export function ServiceOrderStartPrompt({
  open,
  isPending,
  onClose,
  onChoose,
}: ServiceOrderStartPromptProps) {
  const { t } = useTranslation();

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open && !isPending) onClose();
      }}
      placement="center"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="392px"
            w="calc(100% - 32px)"
            bg="white"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="14px"
            overflow="hidden"
          >
            <Dialog.Header
              px="16px"
              py="12px"
              borderBottomWidth="1px"
              borderColor="#F4F6F9"
            >
              <Dialog.Title
                color="#0F1729"
                fontSize="12px"
                fontWeight={700}
                lineHeight="18px"
              >
                {t("ServiceOrders.startPrompt.title")}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body p="16px">
              <Stack gap="12px">
                <Dialog.Description
                  color="#0F1729"
                  fontSize="12px"
                  fontWeight={700}
                  lineHeight="18px"
                >
                  {t("ServiceOrders.startPrompt.question")}
                </Dialog.Description>
                <Flex gap="8px">
                  <Button
                    flex="1"
                    variant="plain"
                    h="36px"
                    px="12px"
                    borderWidth="1px"
                    borderColor="#E5E8EE"
                    rounded="10px"
                    color="#5A6478"
                    fontSize="12px"
                    fontWeight={500}
                    lineHeight="18px"
                    _hover={{ bg: "#F4F6F9" }}
                    disabled={isPending}
                    onClick={() => onChoose(false)}
                  >
                    {t("ServiceOrders.startPrompt.onlyAdd")}
                  </Button>
                  <Button
                    flex="1"
                    h="36px"
                    px="12px"
                    bg="#1F5AFF"
                    rounded="10px"
                    color="white"
                    fontSize="12px"
                    fontWeight={700}
                    lineHeight="18px"
                    _hover={{ bg: "#1646CC" }}
                    loading={isPending}
                    onClick={() => onChoose(true)}
                  >
                    {t("ServiceOrders.startPrompt.start")}
                  </Button>
                </Flex>
              </Stack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
