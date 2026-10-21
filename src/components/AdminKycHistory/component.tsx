"use client";

import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "@/functions/formatDateTime";

import { AdminKycHistoryProps } from "./interface";

/** Histórico da solicitação, do evento mais antigo para o mais novo. */
export function AdminKycHistory({
  history,
  documents,
  currentUserId,
  isLoadingMore = false,
  onLoadMore,
}: AdminKycHistoryProps) {
  const { t, i18n } = useTranslation();

  const documentName = (documentId: string | null) => {
    const document = documents.find((item) => item.id === documentId);
    return document
      ? t(`Admin.review.documentTypes.${document.document_type}`, {
          defaultValue: document.document_type,
        })
      : null;
  };

  const actorName = (actorId: string | null) =>
    !actorId
      ? t("Admin.review.history.system")
      : actorId === currentUserId
        ? t("Admin.review.history.you")
        : t("Admin.review.history.reviewer", { id: actorId.slice(0, 8) });

  if (history.items.length === 0) {
    return (
      <Text color="#8A9AB5" fontSize="12.5px">
        {t("Admin.review.history.empty")}
      </Text>
    );
  }

  return (
    <Stack gap={0}>
      {history.items.map((event, index) => {
        const document = documentName(event.document_id);
        const decision = event.details?.decision;
        return (
          <Flex key={event.id} gap="12px">
            <Flex direction="column" align="center" flexShrink={0}>
              <Box boxSize="8px" mt="6px" rounded="full" bg="#1F5AFF" />
              {index < history.items.length - 1 && (
                <Box w="1px" flex="1" bg="#E5E8EE" />
              )}
            </Flex>
            <Stack gap={0} pb="14px" minW={0}>
              <Text color="#0F1729" fontSize="13px" fontWeight={600}>
                {t(`Admin.review.history.events.${event.event_type}`, {
                  defaultValue: event.event_type,
                })}
                {document ? ` · ${document}` : ""}
                {typeof decision === "string"
                  ? ` · ${t(`Admin.review.decisions.${decision}.label`, {
                      defaultValue: decision,
                    })}`
                  : ""}
              </Text>
              <Text color="#8A9AB5" fontSize="11.5px">
                {actorName(event.actor_id)} ·{" "}
                {formatDateTime(event.occurred_at, i18n.language)}
              </Text>
            </Stack>
          </Flex>
        );
      })}

      {history.items.length < history.total && (
        <Button
          alignSelf="flex-start"
          variant="outline"
          h="34px"
          px="12px"
          rounded="10px"
          borderColor="#E5E8EE"
          color="#1F5AFF"
          fontSize="12.5px"
          fontWeight={600}
          loading={isLoadingMore}
          onClick={onLoadMore}
        >
          {t("Admin.review.history.loadMore", {
            loaded: history.items.length,
            total: history.total,
          })}
        </Button>
      )}
    </Stack>
  );
}
