"use client";

import { Dialog, Portal } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";

import FormStorageQuota from "@/components/Forms/FormStorageQuota";
import { toaster } from "@/components/ui/toaster";
import { formatMegabytes } from "@/functions/formatMegabytes";

import { StorageQuotaDialogProps } from "./interface";

/**
 * "Atualizar cota de armazenamento" (Figma 2902-99727): alteração da cota de
 * cobertura de uma organização, só para o `super_admin`. Fecha por
 * "Cancelar" ou Esc; ao salvar, confirma com um aviso e fecha.
 */
export function StorageQuotaDialog({
  open,
  onClose,
  quota,
  organizationName,
  locale,
}: StorageQuotaDialogProps) {
  const { t } = useTranslation();
  const { storage, isSaving, updateQuota } = quota;
  const [saveError, setSaveError] = React.useState<string>();

  const close = () => {
    setSaveError(undefined);
    onClose();
  };

  return (
    <Dialog.Root
      open={open && !!storage}
      onOpenChange={(details) => {
        if (!details.open && !isSaving) close();
      }}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="512px"
            w="calc(100% - 32px)"
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
              borderBottomWidth="1px"
              borderColor="#E5E8EE"
            >
              <Dialog.Title
                color="#0F1729"
                fontSize="18px"
                fontWeight={700}
                lineHeight="27px"
              >
                {t("CoverageStorage.quota.title")}
              </Dialog.Title>
              <Dialog.Description
                color="#8A9AB5"
                fontSize="13px"
                lineHeight="19.5px"
              >
                {t("CoverageStorage.quota.description")}
              </Dialog.Description>
            </Dialog.Header>

            <Dialog.Body px="24px" py="20px">
              {storage && (
                <FormStorageQuota
                  storage={storage}
                  organizationName={organizationName}
                  isSaving={isSaving}
                  error={saveError}
                  locale={locale}
                  onCancel={close}
                  onSubmit={async (input) => {
                    setSaveError(undefined);
                    const result = await updateQuota(input);
                    if (!result.ok) {
                      setSaveError(t(result.errorKey));
                      return;
                    }
                    close();
                    toaster.create({
                      type: "success",
                      title: t("CoverageStorage.quota.saved", {
                        name: organizationName,
                        quota: formatMegabytes(result.storage.quotaMb, locale),
                      }),
                    });
                  }}
                />
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
