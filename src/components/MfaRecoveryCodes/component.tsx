"use client";

import {
  Box,
  Button,
  Checkbox,
  Flex,
  Icon,
  Image,
  Stack,
  Text,
  VisuallyHidden,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuCheck, LuChevronLeft } from "react-icons/lu";

import { downloadTextFile } from "@/functions/downloadTextFile";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

import { MfaRecoveryCodesProps } from "./interface";

const outlineButtonProps = {
  type: "button",
  variant: "outline",
  flex: "1",
  h: "50px",
  px: "12px",
  gap: "10px",
  bg: "white",
  rounded: "9px",
  borderColor: "#CBD5E6",
  color: "#0F1729",
  fontSize: "16px",
  fontWeight: 600,
  lineHeight: "24px",
  _hover: { bg: "#F7F8FA" },
} as const;

/**
 * Segunda tela da configuração do autenticador (NEU-479): códigos de
 * recuperação exibidos uma única vez. Renderiza o array devolvido pelo servidor
 * (sem assumir quantidade), oferece copiar e baixar um .txt gerado no próprio
 * browser — nada passa por storage — e só avança com a confirmação de que os
 * códigos foram guardados.
 *
 * Figma: Neutra+ MP · "Recovery Codes Card" (2541:63556).
 */
export function MfaRecoveryCodes({
  codes,
  saved,
  onSavedChange,
  onNext,
  onBack,
}: MfaRecoveryCodesProps) {
  const { t } = useTranslation();
  const { status, copy } = useCopyToClipboard();
  const [showSavedError, setShowSavedError] = React.useState(false);

  const asText = codes.join("\n");

  // Duas colunas, como no layout; a numeração segue contínua entre elas.
  const half = Math.ceil(codes.length / 2);
  const columns = [codes.slice(0, half), codes.slice(half)].filter(
    (column) => column.length > 0,
  );

  const download = () =>
    downloadTextFile(
      t("MfaEnrollment.recoveryCodes.fileName"),
      `${t("MfaEnrollment.recoveryCodes.fileHeader")}\n\n${asText}\n`,
    );

  const next = () => {
    if (!saved) {
      setShowSavedError(true);
      return;
    }
    onNext();
  };

  return (
    <Stack w="full" maxW="720px" gap={0}>
      <Button
        type="button"
        variant="plain"
        onClick={onBack}
        alignSelf="flex-start"
        h="24px"
        px={0}
        gap="6px"
      >
        <Icon as={LuChevronLeft} boxSize="16px" color="#8A9AB5" />
        <Text
          fontSize="16px"
          fontWeight={500}
          lineHeight="24px"
          color="#8A9AB5"
        >
          {t("MfaEnrollment.back")}
        </Text>
      </Button>

      <Stack gap="20px" align="center" pt="24px">
        <Stack gap="6px" textAlign="center">
          <Text
            as="h1"
            fontSize="28px"
            fontWeight={700}
            lineHeight="38px"
            color="#0F1729"
          >
            {t("MfaEnrollment.recoveryCodes.title")}
          </Text>
          <Text
            mx="auto"
            maxW="520px"
            fontSize="15px"
            lineHeight="22px"
            color="#5A7CAD"
          >
            {t("MfaEnrollment.recoveryCodes.subtitle")}
          </Text>
        </Stack>

        <Flex
          w="full"
          gap="14px"
          align="flex-start"
          px="18px"
          py="14px"
          rounded="10px"
          bg="#FFFBEB"
          borderWidth="1px"
          borderColor="#FD9E0B"
        >
          <Image
            src="/assets/mfa/warning.svg"
            alt=""
            width="30px"
            height="30px"
            mt="4px"
            flexShrink={0}
          />
          <Box color="#4F321C">
            <Text fontSize="15px" fontWeight={700} lineHeight="22px">
              {t("MfaEnrollment.recoveryCodes.important.title")}
            </Text>
            <Text pt="2px" fontSize="14px" lineHeight="20px">
              {t("MfaEnrollment.recoveryCodes.important.description")}
            </Text>
          </Box>
        </Flex>

        <Flex
          direction={{ base: "column", sm: "row" }}
          gap={{ base: "12px", sm: "54px" }}
          align={{ base: "stretch", sm: "center" }}
          px={{ base: "24px", sm: "42px" }}
          py="9px"
          rounded="10px"
          bg="#F7F8FA"
          role="group"
          aria-label={t("MfaEnrollment.recoveryCodes.listLabel")}
        >
          {columns.map((column, columnIndex) => (
            <React.Fragment key={columnIndex}>
              {columnIndex > 0 && (
                <Box
                  display={{ base: "none", sm: "block" }}
                  alignSelf="stretch"
                  w="1px"
                  my="8px"
                  bg="#CBD5E6"
                />
              )}
              <Box
                as="ul"
                listStyleType="none"
                w={{ base: "full", sm: "270px" }}
              >
                {column.map((code, index) => (
                  <Flex
                    as="li"
                    key={`${columnIndex}-${code}`}
                    fontFamily="mono"
                    fontSize="16px"
                    lineHeight="28px"
                    color="#0F1729"
                  >
                    <Box as="span" w="48px" flexShrink={0}>
                      {columnIndex * half + index + 1}.
                    </Box>
                    <Box as="span">{code}</Box>
                  </Flex>
                ))}
              </Box>
            </React.Fragment>
          ))}
        </Flex>

        <Flex
          w="full"
          direction={{ base: "column", sm: "row" }}
          gap={{ base: "12px", sm: "40px" }}
        >
          <Button {...outlineButtonProps} onClick={() => copy(asText)}>
            {status === "copied"
              ? t("MfaEnrollment.recoveryCodes.copied")
              : t("MfaEnrollment.recoveryCodes.copy")}
            {status === "copied" ? (
              <Icon as={LuCheck} boxSize="22px" color="#16A34A" />
            ) : (
              <Image
                src="/assets/mfa/copy.svg"
                alt=""
                width="22px"
                height="22px"
              />
            )}
          </Button>
          <Button {...outlineButtonProps} onClick={download}>
            <span aria-hidden>↓</span>
            {t("MfaEnrollment.recoveryCodes.download")}
          </Button>
        </Flex>

        <VisuallyHidden aria-live="polite">
          {status === "copied" && t("MfaEnrollment.recoveryCodes.copied")}
          {status === "failed" && t("MfaEnrollment.copyFailed")}
        </VisuallyHidden>
        {status === "failed" && (
          <Text fontSize="12px" color="error.500">
            {t("MfaEnrollment.copyFailed")}
          </Text>
        )}

        <Box w="full" maxW="648px">
          <Checkbox.Root
            checked={saved}
            invalid={showSavedError && !saved}
            onCheckedChange={(e) => {
              onSavedChange(e.checked === true);
              if (e.checked === true) setShowSavedError(false);
            }}
            alignItems="flex-start"
            gap="14px"
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control
              mt="6px"
              boxSize="24px"
              rounded="5px"
              bg="white"
              borderWidth="1px"
              borderColor="#1F5AFF"
              _checked={{ bg: "#1F5AFF", borderColor: "#1F5AFF" }}
            />
            <Checkbox.Label
              fontSize="13px"
              fontWeight={400}
              lineHeight="19px"
              color="#5A7CAD"
            >
              {t("MfaEnrollment.recoveryCodes.acknowledge")}
            </Checkbox.Label>
          </Checkbox.Root>
          {showSavedError && !saved && (
            <Text role="alert" pt="6px" fontSize="12px" color="error.500">
              {t("MfaEnrollment.errors.recoveryCodesNotSaved")}
            </Text>
          )}
        </Box>

        <Button
          type="button"
          onClick={next}
          w="full"
          maxW="355px"
          h="54px"
          bg="#1F5AFF"
          color="white"
          rounded="9px"
          fontSize="16px"
          fontWeight={600}
          lineHeight="24px"
          _hover={{ bg: "brand.600" }}
        >
          {t("MfaEnrollment.recoveryCodes.next")}
          <span aria-hidden>→</span>
        </Button>
      </Stack>
    </Stack>
  );
}
