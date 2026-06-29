"use client";

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuCheck, LuFileText, LuUpload } from "react-icons/lu";

import {
  DocumentSlot,
  DocumentsUploadProps,
  DocumentTag,
  DocumentUploadState,
} from "./interface";

const TAG_COLORS: Record<DocumentTag, string> = {
  basic: "#5C86FF",
  verified: "#D29922",
  complete: "#26FF67",
};

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function DocumentsUpload({ documents, onChange }: DocumentsUploadProps) {
  const { t } = useTranslation();

  const [states, setStates] = useState<Record<string, DocumentUploadState>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Sincroniza com o formulário os arquivos já enviados.
  useEffect(() => {
    const files = Object.values(states)
      .filter((s) => s.status === "sent" && s.file)
      .map((s) => s.file as File);
    onChange?.(files);
  }, [states, onChange]);

  // Limpa timers ao desmontar.
  useEffect(() => {
    const running = timers.current;
    return () => {
      Object.values(running).forEach((id) => clearInterval(id));
    };
  }, []);

  const startUpload = (id: string, file: File) => {
    setStates((prev) => ({
      ...prev,
      [id]: { status: "uploading", progress: 0, file },
    }));

    // TODO: substituir simulação por upload real (XHR/fetch com onUploadProgress).
    clearInterval(timers.current[id]);
    timers.current[id] = setInterval(() => {
      setStates((prev) => {
        const current = prev[id];
        if (!current || current.status !== "uploading") return prev;

        const next = Math.min(current.progress + 8, 100);
        if (next >= 100) {
          clearInterval(timers.current[id]);
          return {
            ...prev,
            [id]: { ...current, status: "sent", progress: 100 },
          };
        }
        return { ...prev, [id]: { ...current, progress: next } };
      });
    }, 150);
  };

  const cancelUpload = (id: string) => {
    clearInterval(timers.current[id]);
    setStates((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const renderAction = (doc: DocumentSlot, state?: DocumentUploadState) => {
    if (state?.status === "sent") {
      return (
        <Flex
          align="center"
          gap={1}
          px={3}
          py={1}
          rounded="full"
          bg="rgba(38, 255, 103, 0.12)"
          flexShrink={0}
        >
          <Icon as={LuCheck} color="#26FF67" boxSize={4} />
          <Text fontSize="13px" color="#26FF67">
            {t("Register.docs.status.sent")}
          </Text>
        </Flex>
      );
    }

    if (state?.status === "uploading") {
      return (
        <Button
          size="sm"
          variant="outline"
          colorPalette="red"
          flexShrink={0}
          onClick={() => cancelUpload(doc.id)}
        >
          {t("Register.docs.actions.cancel")}
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        flexShrink={0}
        onClick={() => inputRefs.current[doc.id]?.click()}
      >
        <LuUpload /> {t("Register.docs.actions.upload")}
      </Button>
    );
  };

  return (
    <Stack gap={0}>
      {documents.map((doc) => {
        const state = states[doc.id];
        const tagColor = TAG_COLORS[doc.tag];

        return (
          <Flex
            key={doc.id}
            align="center"
            gap={3}
            py={4}
            borderTopWidth="1px"
            borderColor="#1E2536"
            _first={{ borderTopWidth: 0 }}
          >
            <Flex
              align="center"
              justify="center"
              boxSize="40px"
              rounded="8px"
              bg="rgba(31, 90, 255, 0.12)"
              flexShrink={0}
            >
              <Icon as={LuFileText} color="#5C86FF" boxSize={5} />
            </Flex>

            <Box flex="1" minW={0}>
              <Text fontWeight={600} fontSize="14px">
                {doc.title}
              </Text>

              <Flex align="center" gap={2} mt={1}>
                <Box
                  as="span"
                  fontSize="11px"
                  fontWeight={700}
                  color={tagColor}
                  bg={`${tagColor}1A`}
                  px={2}
                  py="2px"
                  rounded="full"
                  flexShrink={0}
                >
                  {t(`Register.docs.tags.${doc.tag}`)}
                </Box>

                <Text fontSize="13px" color="#99A1AF" truncate>
                  {state?.status === "uploading"
                    ? `${t("Register.docs.status.sending")} ${state.progress}%`
                    : state?.status === "sent" && state.file
                      ? `${state.file.name} · ${formatSize(state.file.size)}`
                      : t("Register.docs.status.pending")}
                </Text>
              </Flex>

              {state?.status === "uploading" && (
                <Box
                  mt={2}
                  h="6px"
                  rounded="full"
                  bg="#364153"
                  overflow="hidden"
                >
                  <Box
                    h="full"
                    w={`${state.progress}%`}
                    bg="#1F5AFF"
                    transition="width 0.15s linear"
                  />
                </Box>
              )}
            </Box>

            {renderAction(doc, state)}

            <input
              ref={(el) => {
                inputRefs.current[doc.id] = el;
              }}
              type="file"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) startUpload(doc.id, file);
                e.target.value = "";
              }}
            />
          </Flex>
        );
      })}
    </Stack>
  );
}
