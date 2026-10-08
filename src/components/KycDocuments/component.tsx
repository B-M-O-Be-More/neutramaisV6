"use client";

import {
  Box,
  Button,
  chakra,
  Flex,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  LuArrowRight,
  LuCheck,
  LuCircleAlert,
  LuCircleCheckBig,
  LuShieldCheck,
  LuUpload,
} from "react-icons/lu";

import { toaster } from "@/components/ui/toaster";
import {
  KYC_TARGET_LEVELS,
  kycGroupsFor,
  type KycDocumentGroup,
  type KycDocumentItem,
  type KycTargetLevel,
} from "@/data/kycDocuments";
import { useKycDocuments } from "@/hooks/useKycDocuments";
import { KYC_MIME_TYPES } from "@/services/kyc.service";

import { KycDocumentsProps } from "./interface";

// Paleta por nível: o card selecionado e o cabeçalho do grupo usam a mesma.
const LEVEL_COLORS: Record<
  KycTargetLevel,
  { bg: string; border: string; fg: string }
> = {
  basic: { bg: "#EEF3FF", border: "#C7D8FF", fg: "#1F5AFF" },
  verified: { bg: "#EEF3FF", border: "#C7D8FF", fg: "#1F5AFF" },
  complete: { bg: "#EDFBF5", border: "#AAECD5", fg: "#10B981" },
};

/**
 * Tela de KYC pós-cadastro (Figma 1920-18413): confirma a criação da conta e
 * oferece o envio de documentos para subir de nível de KYC.
 *
 * Usada na página autenticada `/kyc`, para onde o login leva quem ainda deve
 * documentos: `/kyc/artifacts` e `/kyc/submit` exigem sessão, por isso a tela
 * não fica no cadastro (que segue terminando no KycNextSteps).
 *
 * - Básico: já ativo, sem documentos.
 * - Verificado: o grupo "KYC Verificado".
 * - Completo: os grupos "KYC Verificado" e "KYC Completo".
 *
 * Cada arquivo é registrado na hora em `/kyc/artifacts` (ver useKycDocuments).
 * No CTA, os `artifact_id` registrados vão todos para `/kyc/submit`; sem
 * nenhum documento enviado, a tela só é encerrada.
 */
export function KycDocuments({ organizationId, onFinish }: KycDocumentsProps) {
  const { t } = useTranslation();
  const kyc = useKycDocuments(organizationId);

  const [level, setLevel] = React.useState<KycTargetLevel>("complete");
  const groups = kycGroupsFor(level);

  // Um input só, reaproveitado por todas as linhas: guarda qual documento pediu
  // o arquivo.
  const inputRef = React.useRef<HTMLInputElement>(null);
  const targetRef = React.useRef<{
    item: KycDocumentItem;
    group: KycDocumentGroup;
  } | null>(null);

  const pickFile = (group: KycDocumentGroup, item: KycDocumentItem) => {
    targetRef.current = { group, item };
    inputRef.current?.click();
  };

  // Tudo o que já foi registrado vai para análise, completo ou não: quem decide
  // se basta para o nível é o backend.
  const finish = async () => {
    if (kyc.artifactIds.length > 0) {
      const ok = await kyc.submit();
      if (!ok) {
        toaster.create({
          type: "error",
          title: t("Register.flow.kyc.errors.submit"),
        });
        return;
      }
    }
    onFinish();
  };

  const renderLevelCard = (option: KycTargetLevel) => {
    const selected = level === option;
    const colors = LEVEL_COLORS[option];

    return (
      <chakra.button
        key={option}
        type="button"
        onClick={() => setLevel(option)}
        aria-pressed={selected}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="flex-start"
        minH="105px"
        p="14px"
        rounded="14px"
        borderWidth="2px"
        borderColor={selected ? colors.fg : "border.default"}
        bg={selected ? colors.bg : "bg.surface"}
        textAlign="left"
        cursor="pointer"
        transition="border-color 0.2s, background 0.2s"
        _hover={{ borderColor: selected ? undefined : "gray.300" }}
      >
        <Text fontSize="12px" fontWeight={700} lineHeight="18px">
          {t(`Register.flow.kyc.levels.${option}.title`)}
        </Text>
        <Text
          pt="2px"
          fontSize="11px"
          fontWeight={500}
          lineHeight="16.5px"
          color="fg.muted"
          whiteSpace="pre-line"
        >
          {t(`Register.flow.kyc.levels.${option}.description`)}
        </Text>
        {option === "basic" && (
          <Text
            as="span"
            mt="6px"
            px="6px"
            py="2px"
            rounded="8px"
            bg="#FFFBEB"
            color="#D97706"
            fontSize="9px"
            fontWeight={700}
            lineHeight="13.5px"
          >
            {t("Register.flow.kyc.levels.basic.current")}
          </Text>
        )}
      </chakra.button>
    );
  };

  const renderDocument = (
    group: KycDocumentGroup,
    item: KycDocumentItem,
    last: boolean,
  ) => {
    const state = kyc.documents[item.type];
    const sent = state?.status === "sent";
    const uploading = state?.status === "uploading";
    const colors = LEVEL_COLORS[group.level];

    return (
      <Flex
        key={item.type}
        align="center"
        gap="12px"
        px="20px"
        py="14px"
        borderBottomWidth={last ? 0 : "1px"}
        borderColor="#F4F6F9"
      >
        <Flex
          align="center"
          justify="center"
          boxSize="32px"
          rounded="10px"
          flexShrink={0}
          bg={sent ? "#EDFBF5" : "#F4F6F9"}
        >
          <Icon
            as={sent ? LuCheck : LuUpload}
            boxSize="14px"
            color={sent ? "#10B981" : "#A0ABB8"}
          />
        </Flex>

        <Box flex="1" minW={0}>
          <Text fontSize="13px" lineHeight="19.5px" color="fg.default">
            {t(`Register.flow.kyc.docs.${item.type}`)}
          </Text>
          {state?.error ? (
            <Text fontSize="10px" lineHeight="15px" color="#EF4444" pt="5px">
              {t(state.error)}
            </Text>
          ) : sent && state.fileName ? (
            <Text
              fontSize="10px"
              lineHeight="15px"
              color="#10B981"
              pt="5px"
              truncate
            >
              {state.fileName}
            </Text>
          ) : (
            item.optional && (
              <Text fontSize="10px" lineHeight="15px" color="#A0ABB8" pt="5px">
                {t("Register.flow.kyc.optional")}
              </Text>
            )
          )}
        </Box>

        <Button
          type="button"
          onClick={() => pickFile(group, item)}
          loading={uploading}
          loadingText={t("Register.flow.kyc.sending")}
          disabled={kyc.submitting}
          flexShrink={0}
          h="auto"
          minW={0}
          px="13px"
          py="7px"
          rounded="10px"
          borderWidth="1px"
          borderColor={colors.border}
          bg={colors.bg}
          color={colors.fg}
          fontSize="12px"
          fontWeight={600}
          lineHeight="18px"
          _hover={{ borderColor: colors.fg }}
        >
          {t(
            sent
              ? "Register.flow.kyc.actions.replace"
              : "Register.flow.kyc.actions.upload",
          )}
        </Button>
      </Flex>
    );
  };

  const renderGroup = (group: KycDocumentGroup) => {
    const colors = LEVEL_COLORS[group.level];
    const sentCount = group.documents.filter(
      (doc) => kyc.documents[doc.type]?.status === "sent",
    ).length;

    return (
      <Box
        key={group.level}
        w="full"
        bg="bg.surface"
        borderWidth="1px"
        borderColor="border.default"
        rounded="14px"
        overflow="hidden"
      >
        <Flex
          align="center"
          justify="space-between"
          gap={2}
          px="20px"
          pt="14px"
          pb="15px"
          bg={colors.bg}
          borderBottomWidth="1px"
          borderColor={colors.border}
        >
          <Flex align="center" gap="8px">
            <Icon as={LuShieldCheck} boxSize="14px" color={colors.fg} />
            <Text
              fontSize="13px"
              fontWeight={700}
              lineHeight="19.5px"
              color={colors.fg}
            >
              {t(`Register.flow.kyc.groups.${group.level}`)}
            </Text>
          </Flex>
          <Text
            fontSize="11px"
            lineHeight="16.5px"
            color={colors.fg}
            flexShrink={0}
          >
            {t("Register.flow.kyc.sentCount", {
              sent: sentCount,
              total: group.documents.length,
            })}
          </Text>
        </Flex>

        {group.documents.map((item, index) =>
          renderDocument(group, item, index === group.documents.length - 1),
        )}
      </Box>
    );
  };

  return (
    <Stack gap="20px" w="full">
      {/* Conta criada */}
      <Stack gap={0} align="center">
        <Flex
          align="center"
          justify="center"
          boxSize="56px"
          rounded="16px"
          bg="#EDFBF5"
        >
          <Icon as={LuCircleCheckBig} boxSize="26px" color="#10B981" />
        </Flex>

        <Text
          pt="12px"
          fontSize="20px"
          fontWeight={800}
          lineHeight="30px"
          color="fg.default"
          textAlign="center"
        >
          {t("Register.flow.kyc.created.title")}
        </Text>

        <Text
          pt="4px"
          fontSize="14px"
          lineHeight="21px"
          color="fg.muted"
          textAlign="center"
        >
          {t("Register.flow.kyc.created.subtitle")}
        </Text>
      </Stack>

      {/* Nível desejado */}
      <Stack gap="12px">
        <Text
          fontSize="14px"
          fontWeight={700}
          lineHeight="21px"
          color="fg.default"
        >
          {t("Register.flow.kyc.levelQuestion")}
        </Text>
        <SimpleGrid columns={{ base: 1, sm: 3 }} gap="8px">
          {KYC_TARGET_LEVELS.map(renderLevelCard)}
        </SimpleGrid>
      </Stack>

      {/* Documentos do nível */}
      {groups.map(renderGroup)}

      <Flex
        align="flex-start"
        gap="8px"
        bg="#FFFBEB"
        borderWidth="1px"
        borderColor="#FDE68A"
        rounded="14px"
        px="17px"
        py="15px"
      >
        <Icon
          as={LuCircleAlert}
          boxSize="13px"
          color="#D97706"
          mt="2px"
          flexShrink={0}
        />
        <Text fontSize="12px" lineHeight="18px" color="#92400E">
          <Trans
            i18nKey="Register.flow.kyc.notice"
            components={{ strong: <Text as="span" fontWeight={700} /> }}
          />
        </Text>
      </Flex>

      <Button
        type="button"
        onClick={finish}
        loading={kyc.submitting}
        disabled={kyc.uploading}
        w="full"
        h="55px"
        rounded="14px"
        bg="brand.500"
        color="white"
        fontSize="14px"
        fontWeight={700}
        justifyContent="flex-start"
        gap="8px"
        px="12px"
        _hover={{ bg: "brand.600" }}
      >
        <Icon as={LuArrowRight} boxSize="15px" />
        {t("Register.flow.kyc.cta")}
      </Button>

      <input
        ref={inputRef}
        type="file"
        hidden
        accept={KYC_MIME_TYPES.join(",")}
        data-testid="kyc-file-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          const target = targetRef.current;
          // Limpa para que escolher o mesmo arquivo de novo dispare onChange.
          event.target.value = "";
          if (!file || !target) return;
          void kyc.upload(target.item.type, target.group.level, file);
        }}
      />
    </Stack>
  );
}
