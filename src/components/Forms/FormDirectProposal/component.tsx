"use client";

import {
  Box,
  Button,
  Checkbox,
  Flex,
  Icon,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuCalendar,
  LuDollarSign,
  LuFileText,
  LuMapPin,
  LuNetwork,
  LuPaperclip,
  LuUpload,
  LuX,
} from "react-icons/lu";

import OfferMaskedInput, {
  MONEY_MASK,
  POSTAL_CODE_MASK,
} from "@/components/OfferMaskedInput";
import {
  PROPOSALS_DIALOG_BUTTONS,
  ProposalsDialogFooter,
} from "@/components/ProposalsDialogFrame";
import { formatFileSize } from "@/functions/formatFileSize";
import {
  DIRECT_PROPOSAL_ATTACHMENT_TYPES,
  DIRECT_PROPOSAL_ATTACHMENTS_MAX,
  directProposalSchema,
} from "@/schemas/directProposal";

import { DirectProposalValues, FormDirectProposalProps } from "./interface";

const PURPLE = "#8B5CF6";

// Campos do modal (Figma 2456-37099): fundo branco, raio 10 e texto 13px.
const FIELD_STYLES = {
  h: "42px",
  px: "16px",
  bg: "white",
  borderWidth: "1px",
  borderColor: "#E5E8EE",
  rounded: "10px",
  color: "#0A0A0A",
  fontSize: "13px",
  lineHeight: "19.5px",
  focusRingColor: PURPLE,
  _placeholder: { color: "rgba(10,10,10,0.5)" },
} as const;

// Mantém o input de arquivo acessível ao teclado sem aparecer.
const VISUALLY_HIDDEN: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};

const FIELD_ORDER: (keyof DirectProposalValues)[] = [
  "street",
  "number",
  "postalCode",
  "ports",
  "contractMonths",
  "price",
  "sla",
  "delivery",
  "cancellation",
  "message",
  "attachments",
];

function Field({
  id,
  label,
  hint,
  error,
  helper,
  children,
}: {
  id: string;
  label: string;
  /** Complemento em cinza após o rótulo (ex.: "(Mínimo: 10)"). */
  hint?: string;
  error?: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <Stack gap="6px" minW={0}>
      <Text
        asChild
        color="#0F1729"
        fontSize="13px"
        fontWeight={600}
        lineHeight="19.5px"
      >
        <label htmlFor={id}>
          {label}
          {hint && (
            <Text as="span" color="#A0ABB8">
              {" "}
              {hint}
            </Text>
          )}
        </label>
      </Text>
      {children}
      {error && (
        <Text
          id={`${id}-error`}
          color="#EF4444"
          fontSize="11px"
          lineHeight="16.5px"
        >
          {error}
        </Text>
      )}
      {helper && !error && (
        <Text
          id={`${id}-helper`}
          color="#A0ABB8"
          fontSize="11px"
          lineHeight="16.5px"
        >
          {helper}
        </Text>
      )}
    </Stack>
  );
}

/** Ícone à esquerda, dentro do campo (Figma 2456-37096). */
function WithIcon({
  icon,
  children,
}: {
  icon: IconType;
  children: React.ReactNode;
}) {
  return (
    <Box position="relative">
      <Icon
        as={icon}
        position="absolute"
        left="12px"
        top="50%"
        transform="translateY(-50%)"
        boxSize="14px"
        color="#A0ABB8"
        pointerEvents="none"
        zIndex={1}
        aria-hidden
      />
      {children}
    </Box>
  );
}

/**
 * "Nova Proposta" de uma oferta (Figma 2456-32149 e 2456-36945): endereço,
 * portas e vigência; preço em BRL, SLA, prazo e cancelamento; vistoria,
 * mensagem e anexos. "Revisar proposta" só libera com os obrigatórios.
 */
export function FormDirectProposal({
  minPorts,
  defaultValues,
  locale,
  onCancel,
  onSubmit,
}: FormDirectProposalProps) {
  const { t } = useTranslation();
  const schema = React.useMemo(
    () => directProposalSchema(minPorts),
    [minPorts],
  );
  const [isDragging, setIsDragging] = React.useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<DirectProposalValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: { ...schema.getDefault(), ...defaultValues },
  });

  const attachments = useWatch({ control, name: "attachments" }) ?? [];

  const tError = (message?: string) =>
    message ? t(message, { min: minPorts }) : undefined;
  const describedBy = (id: string, error?: string, helper?: string) =>
    [error && `${id}-error`, helper && !error && `${id}-helper`]
      .filter(Boolean)
      .join(" ") || undefined;
  const fieldId = (name: keyof DirectProposalValues) =>
    `direct-proposal-${name}`;

  const setAttachments = (files: File[]) =>
    setValue("attachments", files.slice(0, DIRECT_PROPOSAL_ATTACHMENTS_MAX), {
      shouldValidate: true,
    });
  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const accepted = Array.from(list).filter((file) =>
      DIRECT_PROPOSAL_ATTACHMENT_TYPES.includes(file.type),
    );
    setAttachments([...attachments, ...accepted]);
  };

  // Primeiro campo com erro recebe o foco (RHF segue a ordem de registro).
  const focusFirstError = (fieldErrors: typeof errors) => {
    const first = FIELD_ORDER.find((name) => fieldErrors[name]);
    if (first) document.getElementById(fieldId(first))?.focus();
  };

  const textField = (
    name: "street" | "number" | "sla" | "delivery" | "cancellation",
    options: { icon?: IconType; placeholder?: string } = {},
  ) => {
    const id = fieldId(name);
    const error = tError(errors[name]?.message);
    const input = (
      <Input
        id={id}
        placeholder={options.placeholder}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, error)}
        {...FIELD_STYLES}
        {...(options.icon ? { ps: "36px" } : {})}
        {...register(name)}
      />
    );
    return (
      <Field
        id={id}
        label={t(`SearchNetwork.proposal.fields.${name}`)}
        error={error}
      >
        {options.icon ? (
          <WithIcon icon={options.icon}>{input}</WithIcon>
        ) : (
          input
        )}
      </Field>
    );
  };

  const numberField = (name: "ports" | "contractMonths", icon: IconType) => {
    const id = fieldId(name);
    const error = tError(errors[name]?.message);
    return (
      <Field
        id={id}
        label={t(`SearchNetwork.proposal.fields.${name}`)}
        hint={t(`SearchNetwork.proposal.hints.${name}`, { count: minPorts })}
        error={error}
      >
        <WithIcon icon={icon}>
          <Input
            id={id}
            type="number"
            inputMode="numeric"
            min={name === "ports" ? minPorts : 1}
            step={1}
            aria-invalid={!!error}
            aria-describedby={describedBy(id, error)}
            {...FIELD_STYLES}
            ps="36px"
            {...register(name, { valueAsNumber: true })}
          />
        </WithIcon>
      </Field>
    );
  };

  const priceId = fieldId("price");
  const priceError = tError(errors.price?.message);
  const priceHelper = t("SearchNetwork.proposal.helpers.price");
  const postalId = fieldId("postalCode");
  const postalError = tError(errors.postalCode?.message);
  const messageId = fieldId("message");
  const messageError = tError(errors.message?.message);
  const attachmentsId = fieldId("attachments");
  const attachmentsError = tError(errors.attachments?.message);

  return (
    <Stack asChild gap="24px">
      <form noValidate onSubmit={handleSubmit(onSubmit, focusFirstError)}>
        <Stack
          gap="16px"
          p="20px"
          bg="#F8F9FB"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="14px"
        >
          <Text
            color="#0F1729"
            fontSize="14px"
            fontWeight={700}
            lineHeight="21px"
          >
            {t("SearchNetwork.proposal.detailsTitle")}
          </Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap="12px">
            {textField("street", { icon: LuMapPin })}
            {textField("number")}
            <Field
              id={postalId}
              label={t("SearchNetwork.proposal.fields.postalCode")}
              error={postalError}
            >
              <Controller
                control={control}
                name="postalCode"
                render={({ field }) => (
                  <OfferMaskedInput
                    id={postalId}
                    name={field.name}
                    maskOptions={POSTAL_CODE_MASK}
                    inputMode="numeric"
                    placeholder="00000-000"
                    value={field.value}
                    onAccept={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    aria-invalid={!!postalError}
                    aria-describedby={describedBy(postalId, postalError)}
                    {...FIELD_STYLES}
                  />
                )}
              />
            </Field>
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="12px">
            {numberField("ports", LuNetwork)}
            {numberField("contractMonths", LuCalendar)}
          </SimpleGrid>
        </Stack>

        <Stack gap="16px">
          <Text
            color="#0F1729"
            fontSize="14px"
            fontWeight={700}
            lineHeight="21px"
          >
            {t("SearchNetwork.proposal.requiredTitle")}{" "}
            <Text as="span" color="#EF4444" aria-hidden>
              *
            </Text>
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="16px">
            <Field
              id={priceId}
              label={t("SearchNetwork.proposal.fields.price")}
              error={priceError}
              helper={priceHelper}
            >
              <WithIcon icon={LuDollarSign}>
                <Controller
                  control={control}
                  name="price"
                  render={({ field }) => (
                    <OfferMaskedInput
                      id={priceId}
                      name={field.name}
                      maskOptions={MONEY_MASK}
                      inputMode="decimal"
                      value={field.value}
                      onAccept={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      aria-invalid={!!priceError}
                      aria-describedby={describedBy(
                        priceId,
                        priceError,
                        priceHelper,
                      )}
                      {...FIELD_STYLES}
                      ps="32px"
                    />
                  )}
                />
              </WithIcon>
            </Field>
            {textField("sla", {
              placeholder: t("SearchNetwork.proposal.placeholders.sla"),
            })}
            {textField("delivery", {
              placeholder: t("SearchNetwork.proposal.placeholders.delivery"),
            })}
            {textField("cancellation", {
              placeholder: t(
                "SearchNetwork.proposal.placeholders.cancellation",
              ),
            })}
          </SimpleGrid>

          <Controller
            control={control}
            name="requiresSiteSurvey"
            render={({ field }) => (
              <Checkbox.Root
                checked={field.value}
                onCheckedChange={(details) =>
                  field.onChange(details.checked === true)
                }
                gap="12px"
                colorPalette="purple"
              >
                <Checkbox.HiddenInput onBlur={field.onBlur} />
                <Checkbox.Control />
                <Checkbox.Label
                  color="#0F1729"
                  fontSize="13px"
                  fontWeight={600}
                  lineHeight="19.5px"
                >
                  {t("SearchNetwork.proposal.fields.requiresSiteSurvey")}
                </Checkbox.Label>
              </Checkbox.Root>
            )}
          />

          <Field
            id={messageId}
            label={t("SearchNetwork.proposal.fields.message")}
            error={messageError}
          >
            <Textarea
              id={messageId}
              rows={3}
              placeholder={t("SearchNetwork.proposal.placeholders.message")}
              aria-invalid={!!messageError}
              aria-describedby={describedBy(messageId, messageError)}
              {...FIELD_STYLES}
              h="auto"
              minH="85px"
              py="12px"
              resize="vertical"
              {...register("message")}
            />
          </Field>

          <Stack gap="6px">
            <Text
              asChild
              color="#0F1729"
              fontSize="13px"
              fontWeight={600}
              lineHeight="19.5px"
            >
              <label htmlFor={attachmentsId}>
                {t("SearchNetwork.proposal.fields.attachments")}
              </label>
            </Text>
            <Stack
              asChild
              align="center"
              gap="8px"
              py="24px"
              px="16px"
              bg={isDragging ? "#F8F5FF" : "#F8F9FB"}
              borderWidth="2px"
              borderStyle="dashed"
              borderColor={
                attachmentsError ? "#EF4444" : isDragging ? PURPLE : "#C4CDD8"
              }
              rounded="14px"
              textAlign="center"
              cursor="pointer"
              _focusWithin={{
                outline: `2px solid ${PURPLE}`,
                outlineOffset: "2px",
              }}
              onDragOver={(event: React.DragEvent) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event: React.DragEvent) => {
                event.preventDefault();
                setIsDragging(false);
                addFiles(event.dataTransfer.files);
              }}
            >
              <label>
                <input
                  id={attachmentsId}
                  type="file"
                  multiple
                  accept={DIRECT_PROPOSAL_ATTACHMENT_TYPES.join(",")}
                  aria-describedby={`${attachmentsId}-hint ${attachmentsId}-note`}
                  style={VISUALLY_HIDDEN}
                  onChange={(event) => {
                    addFiles(event.target.files);
                    // Permite escolher o mesmo arquivo de novo depois de remover.
                    event.target.value = "";
                  }}
                />
                <Icon
                  as={LuUpload}
                  boxSize="20px"
                  color="#5A6478"
                  aria-hidden
                />
                <Text color="#5A6478" fontSize="13px" lineHeight="19.5px">
                  {t("SearchNetwork.proposal.dropzone")}
                </Text>
                <Text
                  id={`${attachmentsId}-hint`}
                  color="#A0ABB8"
                  fontSize="11px"
                  lineHeight="16.5px"
                >
                  {t("SearchNetwork.proposal.dropzoneHint")}
                </Text>
              </label>
            </Stack>
            {attachmentsError && (
              <Text color="#EF4444" fontSize="11px" lineHeight="16.5px">
                {attachmentsError}
              </Text>
            )}
            <Text
              id={`${attachmentsId}-note`}
              color="#A0ABB8"
              fontSize="11px"
              lineHeight="16.5px"
            >
              {t("SearchNetwork.proposal.attachmentsNote")}
            </Text>
            {attachments.length > 0 && (
              <Stack as="ul" gap="8px" listStyleType="none">
                {attachments.map((file, index) => (
                  <Flex
                    as="li"
                    key={`${file.name}-${index}`}
                    align="center"
                    gap="10px"
                    px="12px"
                    py="8px"
                    bg="#F8F9FB"
                    borderWidth="1px"
                    borderColor="#E5E8EE"
                    rounded="10px"
                  >
                    <Icon
                      as={LuPaperclip}
                      boxSize="14px"
                      flexShrink={0}
                      color="#8A9AB5"
                      aria-hidden
                    />
                    <Text
                      flex="1"
                      minW={0}
                      truncate
                      color="#0F1729"
                      fontSize="12px"
                      fontWeight={600}
                    >
                      {file.name}
                    </Text>
                    <Text color="#A0ABB8" fontSize="11px" flexShrink={0}>
                      {formatFileSize(file.size, locale)}
                    </Text>
                    <Button
                      variant="plain"
                      size="xs"
                      minW="24px"
                      h="24px"
                      p={0}
                      color="#8A9AB5"
                      _hover={{ color: "#EF4444" }}
                      aria-label={t("SearchNetwork.proposal.removeFile", {
                        name: file.name,
                      })}
                      onClick={() =>
                        setAttachments(
                          attachments.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <Icon as={LuX} boxSize="14px" />
                    </Button>
                  </Flex>
                ))}
              </Stack>
            )}
          </Stack>
        </Stack>

        <ProposalsDialogFooter gap="12px">
          <Button
            {...PROPOSALS_DIALOG_BUTTONS.secondary}
            minH="47px"
            color="#5A6478"
            fontWeight={600}
            onClick={onCancel}
          >
            {t("SearchNetwork.proposal.cancel")}
          </Button>
          <Button
            type="submit"
            {...PROPOSALS_DIALOG_BUTTONS.primary}
            minH="47px"
            bg={PURPLE}
            _hover={{ bg: "#7C4DEB" }}
            _disabled={{ bg: "#C4CDD8", opacity: 1, cursor: "not-allowed" }}
            boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
            disabled={!isValid}
          >
            <Icon as={LuFileText} boxSize="15px" />
            {t("SearchNetwork.proposal.review")}
          </Button>
        </ProposalsDialogFooter>
      </form>
    </Stack>
  );
}
