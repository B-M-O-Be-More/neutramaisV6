"use client";

import { Flex, Icon, IconButton, Input, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuMessageCircle, LuSend } from "react-icons/lu";

import type { ServiceOrderMessageAuthor } from "@/types/serviceOrders";

import { ServiceOrderChatProps } from "./interface";

const MESSAGE_MAX = 2000;

// Balões (Figma 2968-72862): o seller à direita em azul; o buyer à esquerda
// em branco; o sistema à esquerda em roxo.
const BUBBLES: Record<
  ServiceOrderMessageAuthor,
  { bg: string; border: string; color: string; corner: string }
> = {
  seller: {
    bg: "#1F5AFF",
    border: "#1F5AFF",
    color: "white",
    corner: "16px 4px 16px 16px",
  },
  buyer: {
    bg: "white",
    border: "#E5E8EE",
    color: "#0F1729",
    corner: "4px 16px 16px 16px",
  },
  system: {
    bg: "#F3EEFF",
    border: "#D3BFFD",
    color: "#8B5CF6",
    corner: "4px 16px 16px 16px",
  },
};

/**
 * "Comunicação da OS" (Figma 2968-72853): mensagens entre seller, buyer e os
 * registros da Neutra+, e o campo para enviar.
 */
export function ServiceOrderChat({
  messages,
  locale,
  disabled = false,
  onSend,
}: ServiceOrderChatProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = React.useState("");
  const [isSending, setSending] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Mostra sempre a mensagem mais recente.
  React.useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  const formatTime = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const canSend = !disabled && !isSending && draft.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSend) return;
    setSending(true);
    try {
      if (await onSend(draft)) setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <Stack
      as="section"
      aria-labelledby="service-order-chat"
      gap={0}
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="12px"
      overflow="hidden"
    >
      <Flex
        align="center"
        gap="8px"
        px="20px"
        py="16px"
        borderBottomWidth="1px"
        borderColor="#F4F6F9"
      >
        <Icon as={LuMessageCircle} boxSize="14px" color="#1F5AFF" aria-hidden />
        <Text
          id="service-order-chat"
          as="h2"
          color="#0F1729"
          fontSize="13px"
          fontWeight={700}
          lineHeight="19.5px"
        >
          {t("ServiceOrders.chat.title")}
        </Text>
        <Text ms="auto" color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
          {t("ServiceOrders.chat.participants")}
        </Text>
      </Flex>

      <Stack
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label={t("ServiceOrders.chat.title")}
        gap="12px"
        minH="160px"
        maxH="288px"
        overflowY="auto"
        px="20px"
        py="16px"
        bg="#F8F9FB"
      >
        {messages.length === 0 ? (
          <Text
            m="auto"
            color="#A0ABB8"
            fontSize="12px"
            lineHeight="18px"
            textAlign="center"
          >
            {t("ServiceOrders.chat.empty")}
          </Text>
        ) : (
          messages.map((message) => {
            const bubble = BUBBLES[message.author];
            const isOwn = message.author === "seller";
            return (
              <Stack
                key={message.id}
                gap="4px"
                align={isOwn ? "flex-end" : "flex-start"}
              >
                <Flex gap="8px" fontSize="10px" lineHeight="15px">
                  <Text color="#A0ABB8">{message.authorName}</Text>
                  <Text asChild color="#C4CDD8">
                    <time dateTime={message.sentAt}>
                      {formatTime.format(new Date(message.sentAt))}
                    </time>
                  </Text>
                </Flex>
                <Text
                  maxW="70%"
                  px="14px"
                  py="10px"
                  bg={bubble.bg}
                  borderWidth="1px"
                  borderColor={bubble.border}
                  borderRadius={bubble.corner}
                  color={bubble.color}
                  fontSize="13px"
                  lineHeight="19.5px"
                  whiteSpace="pre-wrap"
                  overflowWrap="anywhere"
                >
                  {message.text}
                </Text>
              </Stack>
            );
          })
        )}
      </Stack>

      <Flex
        as="form"
        onSubmit={handleSubmit}
        gap="8px"
        px="16px"
        py="12px"
        borderTopWidth="1px"
        borderColor="#F4F6F9"
      >
        <Input
          flex="1"
          h="42px"
          px="16px"
          bg="#F8F9FB"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="12px"
          color="#0F1729"
          fontSize="13px"
          focusRingColor="#1F5AFF"
          _placeholder={{ color: "rgba(9,9,11,0.5)" }}
          placeholder={t("ServiceOrders.chat.placeholder")}
          aria-label={t("ServiceOrders.chat.placeholder")}
          maxLength={MESSAGE_MAX}
          disabled={disabled}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <IconButton
          type="submit"
          aria-label={t("ServiceOrders.chat.send")}
          boxSize="42px"
          minW="42px"
          bg="#1F5AFF"
          rounded="12px"
          color="white"
          _hover={{ bg: "#1646CC" }}
          disabled={!canSend}
          loading={isSending}
        >
          <Icon as={LuSend} boxSize="15px" />
        </IconButton>
      </Flex>
    </Stack>
  );
}
