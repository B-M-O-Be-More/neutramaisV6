"use client";

import {
  Button,
  chakra,
  CloseButton,
  Dialog,
  Flex,
  Icon,
  Link,
  Portal,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuExternalLink, LuFileWarning } from "react-icons/lu";

import { AdminKycDocumentViewerProps } from "./interface";

/**
 * Visualizador do arquivo de um documento KYC. A URL assinada vem da
 * compliance-api (`access-url` com `purpose: "view"`) e é aberta sem
 * Authorization: PDF em iframe, imagem em <img>.
 */
export function AdminKycDocumentViewer({
  viewer,
  onClose,
  onRetry,
}: AdminKycDocumentViewerProps) {
  const { t } = useTranslation();
  const document = viewer?.document;
  const title = document
    ? t(`Admin.review.documentTypes.${document.document_type}`, {
        defaultValue: document.document_type,
      })
    : "";
  const isImage = document?.mime_type?.startsWith("image/") ?? false;

  return (
    <Dialog.Root
      open={!!viewer}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      size="xl"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="960px" w="calc(100% - 32px)">
            <Dialog.Header>
              <Dialog.Title fontSize="15px" fontWeight={700} color="#0F1729">
                {title}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              {viewer?.error ? (
                <Stack align="center" gap="12px" py="40px" textAlign="center">
                  <Icon as={LuFileWarning} boxSize="22px" color="#EF4444" />
                  <Text color="#0F1729" fontSize="13.5px" fontWeight={600}>
                    {t(viewer.error)}
                  </Text>
                  <Button
                    variant="outline"
                    h="36px"
                    px="14px"
                    rounded="10px"
                    borderColor="#E5E8EE"
                    color="#1F5AFF"
                    fontSize="13px"
                    fontWeight={600}
                    onClick={onRetry}
                  >
                    {t("Admin.review.retry")}
                  </Button>
                </Stack>
              ) : !viewer?.url ? (
                <Flex justify="center" py="64px">
                  <Spinner
                    color="#1F5AFF"
                    size="lg"
                    aria-label={t("Admin.review.viewer.loading")}
                  />
                </Flex>
              ) : isImage ? (
                <Flex justify="center" bg="#F4F6F9" rounded="12px" p="12px">
                  <chakra.img
                    src={viewer.url}
                    alt={title}
                    maxH="70vh"
                    maxW="full"
                    objectFit="contain"
                  />
                </Flex>
              ) : (
                <chakra.iframe
                  src={viewer.url}
                  title={title}
                  w="full"
                  h="70vh"
                  borderWidth="1px"
                  borderColor="#E5E8EE"
                  rounded="12px"
                />
              )}
            </Dialog.Body>

            <Dialog.Footer justifyContent="space-between" gap="12px">
              <Text color="#A0ABB8" fontSize="11.5px">
                {t("Admin.review.viewer.expires")}
              </Text>
              {viewer?.url && (
                <Link
                  href={viewer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="#1F5AFF"
                  fontSize="13px"
                  fontWeight={600}
                >
                  <Icon as={LuExternalLink} boxSize="13px" />
                  {t("Admin.review.viewer.openInNewTab")}
                </Link>
              )}
            </Dialog.Footer>

            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
