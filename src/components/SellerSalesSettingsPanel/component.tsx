"use client";

import {
  Button,
  Field,
  Flex,
  Input,
  SimpleGrid,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";

import {
  useSalesSettings,
  type SalesSettingsSection,
} from "@/hooks/useSalesSettings";

import { SellerSalesSettingsPanelProps } from "./interface";

/** Horas inteiras, a partir de 1. */
const parseHours = (value: string) =>
  /^\d+$/.test(value.trim()) && Number(value) >= 1 ? Number(value) : null;

/** Leitura em andamento ou com falha (com "Tentar de novo"). */
function SectionState<T>({ section }: { section: SalesSettingsSection<T> }) {
  const { t } = useTranslation();
  if (section.isLoading && !section.data) {
    return (
      <Text color="#5A6478" fontSize="13px" role="status">
        {t("SellerSalesSettings.loading")}
      </Text>
    );
  }
  if (section.loadErrorKey) {
    return (
      <Flex align="center" gap="12px" wrap="wrap">
        <Text color="#B91C1C" fontSize="13px" role="alert">
          {t(section.loadErrorKey)}
        </Text>
        <Button
          variant="outline"
          size="sm"
          rounded="10px"
          onClick={section.reload}
        >
          {t("SellerSalesSettings.retry")}
        </Button>
      </Flex>
    );
  }
  return null;
}

/** Cartão de uma configuração: título, explicação e conteúdo. */
function SettingsCard({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Stack
      as="section"
      aria-labelledby={id}
      gap="16px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <Stack gap="2px">
        <Text
          as="h2"
          id={id}
          color="#0F1729"
          fontSize="15px"
          fontWeight={700}
          lineHeight="22.5px"
        >
          {title}
        </Text>
        <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
          {description}
        </Text>
      </Stack>
      {children}
    </Stack>
  );
}

/**
 * Configurações de venda do Seller (D-11), na aba própria do catálogo:
 * prazos de SLA da organização (primeira resposta e resolução, usados em
 * tickets e ordens de serviço) e aceite automático dos pedidos de produtos
 * físicos. Sem `sla:change`, os prazos ficam só para leitura; sem
 * `order:accept`, o aceite automático nem é lido.
 */
export function SellerSalesSettingsPanel({
  permissions,
}: SellerSalesSettingsPanelProps) {
  const { t } = useTranslation();
  const canEditSla = permissions.includes("sla:change");
  const canAccept = permissions.includes("order:accept");
  const { sla, autoAccept } = useSalesSettings({
    canReadAutoAccept: canAccept,
  });

  // Rascunho dos prazos; null = segue o valor lido.
  const [draft, setDraft] = React.useState<{
    first: string;
    resolution: string;
  } | null>(null);
  const first = draft?.first ?? String(sla.data?.maxFirstResponseHours ?? "");
  const resolution =
    draft?.resolution ?? String(sla.data?.maxResolutionHours ?? "");
  const firstHours = parseHours(first);
  const resolutionHours = parseHours(resolution);
  const orderError =
    firstHours !== null &&
    resolutionHours !== null &&
    resolutionHours < firstHours;
  const changed =
    !!sla.data &&
    (firstHours !== sla.data.maxFirstResponseHours ||
      resolutionHours !== sla.data.maxResolutionHours);
  const canSaveSla =
    canEditSla &&
    changed &&
    firstHours !== null &&
    resolutionHours !== null &&
    !orderError;

  const saveSla = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSaveSla) return;
    await sla.save({
      maxFirstResponseHours: firstHours!,
      maxResolutionHours: resolutionHours!,
    });
    setDraft(null);
  };

  const hoursField = (
    key: "first" | "resolution",
    value: string,
    invalid: boolean,
  ) => (
    <Field.Root invalid={invalid} disabled={!canEditSla}>
      <Field.Label color="#0F1729" fontSize="13px" fontWeight={600}>
        {t(`SellerSalesSettings.sla.${key}Label`)}
      </Field.Label>
      <Input
        value={value}
        onChange={(event) =>
          setDraft({
            first,
            resolution,
            [key]: event.target.value.replace(/\D/g, ""),
          })
        }
        inputMode="numeric"
        h="40px"
        rounded="10px"
        fontSize="13px"
      />
      <Field.HelperText fontSize="12px" color="#8A9AB5">
        {t(`SellerSalesSettings.sla.${key}Helper`)}
      </Field.HelperText>
    </Field.Root>
  );

  return (
    <Stack gap="20px">
      <Stack gap="4px">
        <Text
          as="h1"
          color="#0F1729"
          fontSize="24px"
          fontWeight={800}
          lineHeight="36px"
        >
          {t("SellerSalesSettings.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="14px" lineHeight="21px">
          {t("SellerSalesSettings.subtitle")}
        </Text>
      </Stack>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="16px" alignItems="start">
        <SettingsCard
          id="seller-sla-title"
          title={t("SellerSalesSettings.sla.title")}
          description={t("SellerSalesSettings.sla.description")}
        >
          <SectionState section={sla} />
          {sla.data && (
            <form onSubmit={saveSla} noValidate>
              <Stack gap="14px">
                <SimpleGrid columns={{ base: 1, sm: 2 }} gap="12px">
                  {hoursField("first", first, firstHours === null)}
                  {hoursField(
                    "resolution",
                    resolution,
                    resolutionHours === null || orderError,
                  )}
                </SimpleGrid>
                {orderError && (
                  <Text color="#B91C1C" fontSize="12px" role="alert">
                    {t("SellerSalesSettings.errors.slaOrder")}
                  </Text>
                )}
                {canEditSla ? (
                  <Flex align="center" gap="12px" wrap="wrap">
                    <Button
                      type="submit"
                      h="38px"
                      rounded="10px"
                      bg="#1F5AFF"
                      color="white"
                      fontSize="13px"
                      fontWeight={600}
                      disabled={!canSaveSla}
                      loading={sla.isSaving}
                      _hover={{ bg: "#1646CC" }}
                    >
                      {t("SellerSalesSettings.sla.save")}
                    </Button>
                    {sla.saved && !changed && (
                      <Text color="#047857" fontSize="12px" role="status">
                        {t("SellerSalesSettings.saved")}
                      </Text>
                    )}
                  </Flex>
                ) : (
                  <Text color="#8A9AB5" fontSize="12px">
                    {t("SellerSalesSettings.sla.readOnly")}
                  </Text>
                )}
                {sla.saveErrorKey && (
                  <Text color="#B91C1C" fontSize="12px" role="alert">
                    {t(sla.saveErrorKey)}
                  </Text>
                )}
              </Stack>
            </form>
          )}
        </SettingsCard>

        <SettingsCard
          id="seller-auto-accept-title"
          title={t("SellerSalesSettings.autoAccept.title")}
          description={t("SellerSalesSettings.autoAccept.description")}
        >
          {canAccept ? (
            <>
              <SectionState section={autoAccept} />
              {autoAccept.data && (
                <Switch.Root
                  checked={autoAccept.data.autoAccept}
                  disabled={autoAccept.isSaving}
                  onCheckedChange={(details) =>
                    autoAccept.save(details.checked)
                  }
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap="16px"
                  p="14px"
                  bg="#F8F9FB"
                  borderWidth="1px"
                  borderColor="#E5E8EE"
                  rounded="12px"
                  cursor="pointer"
                >
                  <Switch.HiddenInput />
                  <Switch.Label flex="1" minW={0} cursor="inherit">
                    <Stack gap="2px">
                      <Text color="#0F1729" fontSize="13px" fontWeight={700}>
                        {t("SellerSalesSettings.autoAccept.label")}
                      </Text>
                      <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
                        {t(
                          autoAccept.data.autoAccept
                            ? "SellerSalesSettings.autoAccept.on"
                            : "SellerSalesSettings.autoAccept.off",
                        )}
                      </Text>
                    </Stack>
                  </Switch.Label>
                  <Switch.Control
                    flexShrink={0}
                    w="36px"
                    h="20px"
                    bg={autoAccept.data.autoAccept ? "#1F5AFF" : "#D5DBE5"}
                  >
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              )}
              {autoAccept.saveErrorKey && (
                <Text color="#B91C1C" fontSize="12px" role="alert">
                  {t(autoAccept.saveErrorKey)}
                </Text>
              )}
            </>
          ) : (
            <Text color="#8A9AB5" fontSize="12px">
              {t("SellerSalesSettings.autoAccept.noPermission")}
            </Text>
          )}
        </SettingsCard>
      </SimpleGrid>
    </Stack>
  );
}
