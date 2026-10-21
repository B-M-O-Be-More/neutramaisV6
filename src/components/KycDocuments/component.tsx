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
  LuFileWarning,
  LuShieldCheck,
  LuUpload,
} from "react-icons/lu";
import type { IconType } from "react-icons";

import { toaster } from "@/components/ui/toaster";
import {
  KYC_TARGET_LEVELS,
  kycGroupsFor,
  kycSelectableLevels,
  type KycDocumentGroup,
  type KycDocumentItem,
  type KycTargetLevel,
} from "@/data/kycDocuments";
import { useKycDocuments } from "@/hooks/useKycDocuments";
import { KYC_MIME_TYPES, type KycDocumentType } from "@/services/kyc.service";

import { KycDocumentsProps, KycDocumentsVariant } from "./interface";

// Paleta por nível: o card selecionado e o cabeçalho do grupo usam a mesma.
const LEVEL_COLORS: Record<
  KycTargetLevel,
  { bg: string; border: string; fg: string }
> = {
  basic: { bg: "#EEF3FF", border: "#C7D8FF", fg: "#1F5AFF" },
  verified: { bg: "#EEF3FF", border: "#C7D8FF", fg: "#1F5AFF" },
  complete: { bg: "#EDFBF5", border: "#AAECD5", fg: "#10B981" },
};

// Cabeçalho de cada cenário: ícone, cores e chave dos textos (title/subtitle).
const HEADERS: Record<
  KycDocumentsVariant,
  { icon: IconType; bg: string; fg: string; textKey: string }
> = {
  submit: {
    icon: LuCircleCheckBig,
    bg: "#EDFBF5",
    fg: "#10B981",
    textKey: "Register.flow.kyc.created",
  },
  upgrade: {
    icon: LuShieldCheck,
    bg: "#EEF3FF",
    fg: "#1F5AFF",
    textKey: "Kyc.screens.upgrade",
  },
  resubmit: {
    icon: LuFileWarning,
    bg: "#FFFBEB",
    fg: "#D97706",
    textKey: "Kyc.screens.resubmit",
  },
};

/**
 * Requisitos de uma lista de documentos: cada documento é um requisito, menos
 * as alternativas (`oneOf`), que contam juntas — basta uma delas.
 */
function requirementsOf(documents: KycDocumentItem[]) {
  const requirements = new Map<string, KycDocumentType[]>();
  for (const doc of documents) {
    const key = doc.oneOf ?? doc.type;
    requirements.set(key, [...(requirements.get(key) ?? []), doc.type]);
  }
  return [...requirements.values()];
}

/**
 * Tela de KYC pós-cadastro (Figma 1920-18413): confirma a criação da conta e
 * oferece o envio de documentos para pedir um nível de KYC.
 *
 * Usada na página autenticada `/kyc`, para onde o login leva quem ainda deve
 * documentos: `/kyc/artifacts` e `/kyc/submit` exigem sessão, por isso a tela
 * não fica no cadastro (que segue terminando no KycNextSteps).
 *
 * Todo nível passa por análise: o básico pede o cartão CNPJ e o contrato social
 * ou a outorga SCM; o verificado e o completo somam os próprios grupos. Só os
 * níveis acima do já concedido podem ser escolhidos.
 *
 * Cada arquivo é enviado na hora em `/kyc/artifacts` (ver useKycDocuments).
 * No CTA, vão para `/kyc/submit` só os documentos do nível escolhido.
 */
export function KycDocuments({
  organizationId,
  currentLevel = "pending",
  variant = "submit",
  onFinish,
}: KycDocumentsProps) {
  const { t } = useTranslation();
  const header = HEADERS[variant];
  const kyc = useKycDocuments(organizationId);

  const selectable = kycSelectableLevels(currentLevel);
  const [level, setLevel] = React.useState<KycTargetLevel>(
    selectable[selectable.length - 1] ?? "complete",
  );
  const groups = kycGroupsFor(level);
  const isSent = (type: KycDocumentType) =>
    kyc.documents[type]?.status === "sent";
  const countSent = (requirements: KycDocumentType[][]) =>
    requirements.filter((types) => types.some(isSent)).length;

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

  // Só avança com todos os requisitos do nível escolhido enviados.
  const groupDocs = groups.flatMap((group) => group.documents);
  const requirements = requirementsOf(groupDocs);
  const sentRequired = countSent(requirements);
  const canFinish =
    requirements.length > 0 && sentRequired === requirements.length;

  // Vão para análise só os documentos do nível escolhido (alternativas
  // enviadas inclusas).
  const finish = async () => {
    if (!canFinish) return;
    const ok = await kyc.submit(groupDocs.map((doc) => doc.type));
    if (!ok) {
      toaster.create({
        type: "error",
        title: t("Register.flow.kyc.errors.submit"),
      });
      return;
    }
    onFinish();
  };

  const renderLevelCard = (option: KycTargetLevel) => {
    const selected = level === option;
    const colors = LEVEL_COLORS[option];
    // Níveis já concedidos (ou abaixo deles) não podem ser pedidos de novo.
    const canSelect = selectable.includes(option);

    return (
      <chakra.button
        key={option}
        type="button"
        onClick={() => setLevel(option)}
        disabled={!canSelect}
        aria-pressed={canSelect ? selected : undefined}
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
        cursor={canSelect ? "pointer" : "default"}
        transition="border-color 0.2s, background 0.2s"
        _hover={
          canSelect && !selected ? { borderColor: "gray.300" } : undefined
        }
        // Desabilitado só para não ser escolhido: mantém a aparência normal.
        _disabled={{ opacity: 1 }}
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
        {option === currentLevel && (
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
            {t("Register.flow.kyc.levels.current")}
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
            item.oneOf && (
              <Text fontSize="10px" lineHeight="15px" color="#A0ABB8" pt="5px">
                {t(`Register.flow.kyc.oneOf.${item.oneOf}`)}
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
    const groupRequirements = requirementsOf(group.documents);
    const sentCount = countSent(groupRequirements);

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
              total: groupRequirements.length,
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
      {/* Cabeçalho do cenário */}
      <Stack gap={0} align="center">
        <Flex
          align="center"
          justify="center"
          boxSize="56px"
          rounded="16px"
          bg={header.bg}
        >
          <Icon as={header.icon} boxSize="26px" color={header.fg} />
        </Flex>

        <Text
          pt="12px"
          fontSize="20px"
          fontWeight={800}
          lineHeight="30px"
          color="fg.default"
          textAlign="center"
        >
          {t(`${header.textKey}.title`)}
        </Text>

        <Text
          pt="4px"
          fontSize="14px"
          lineHeight="21px"
          color="fg.muted"
          textAlign="center"
        >
          {t(`${header.textKey}.subtitle`)}
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
        <Stack gap="6px">
          {/* O /kyc/submit só considera a seleção enviada: subir de nível ou
              corrigir pede o conjunto inteiro, não só o que falta. */}
          {(currentLevel !== "pending" || variant === "resubmit") && (
            <Text fontSize="12px" lineHeight="18px" color="#92400E">
              {t("Register.flow.kyc.fullSetNotice")}
            </Text>
          )}
          <Text fontSize="12px" lineHeight="18px" color="#92400E">
            <Trans
              i18nKey="Register.flow.kyc.notice"
              components={{ strong: <Text as="span" fontWeight={700} /> }}
            />
          </Text>
        </Stack>
      </Flex>

      <Stack gap="8px">
        <Button
          type="button"
          onClick={finish}
          loading={kyc.submitting}
          disabled={!canFinish || kyc.uploading}
          aria-describedby={canFinish ? undefined : "kyc-required-hint"}
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

        {!canFinish && (
          <Text
            id="kyc-required-hint"
            fontSize="12px"
            lineHeight="18px"
            color="fg.muted"
            textAlign="center"
          >
            {t("Register.flow.kyc.requiredHint", {
              sent: sentRequired,
              total: requirements.length,
            })}
          </Text>
        )}
      </Stack>

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
