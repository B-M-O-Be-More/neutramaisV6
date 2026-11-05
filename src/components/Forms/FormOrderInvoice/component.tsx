"use client";

import {
  Button,
  Flex,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuFileUp, LuSend } from "react-icons/lu";

import Input from "@/components/FormControl/Input";
import {
  cnpjFromNfeAccessKey,
  formatNfeAccessKey,
  isValidNfeAccessKey,
} from "@/functions/nfeAccessKey";
import { toAttachInvoiceInput } from "@/functions/orderShipping";
import { readInvoicePdf } from "@/functions/pdfFile";
import { orderInvoiceSchema } from "@/schemas/orderShipping";

import { FormOrderInvoiceProps, OrderInvoiceValues } from "./interface";

const EMPTY = orderInvoiceSchema.getDefault();

/** 12345678000195 → 12.345.678/0001-95. */
function formatCnpj(value: string): string {
  return value.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      as="h3"
      color="#0F1729"
      fontSize="13px"
      fontWeight={700}
      lineHeight="19.5px"
    >
      {children}
    </Text>
  );
}

/**
 * "Anexar nota fiscal" do pedido físico (RN-LOG-02): o PDF (até 2 MiB), a
 * chave de acesso, o valor dos produtos e os dados de remetente e
 * destinatário que o Melhor Envio usa na etiqueta. O CNPJ do remetente sai
 * da própria chave, como a orders-api exige.
 */
export function FormOrderInvoice({
  defaultValues,
  isSubmitting,
  onCancel,
  onSubmit,
}: FormOrderInvoiceProps) {
  const { t } = useTranslation();
  const fileInput = React.useRef<HTMLInputElement | null>(null);
  const [isReading, setIsReading] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<OrderInvoiceValues>({
    resolver: yupResolver(orderInvoiceSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { ...EMPTY, ...defaultValues },
  });

  const accessKey = useWatch({ control, name: "accessKey" }) ?? "";
  const cnpj = isValidNfeAccessKey(accessKey)
    ? cnpjFromNfeAccessKey(accessKey)
    : null;

  const errorOf = (name: keyof OrderInvoiceValues) => {
    const message = errors[name]?.message;
    return typeof message === "string" ? t(message) : undefined;
  };

  const submit = handleSubmit(async (values) => {
    setIsReading(true);
    const pdf = await readInvoicePdf(values.file);
    setIsReading(false);
    if ("error" in pdf) {
      setError("file", { message: `OrderShipping.errors.pdf.${pdf.error}` });
      return;
    }
    onSubmit(toAttachInvoiceInput(values, pdf.base64));
  });

  const field = (name: keyof OrderInvoiceValues, required = true) => ({
    id: `order-invoice-${name}`,
    label: `${t(`OrderShipping.invoice.fields.${name}`)}${required ? " *" : ""}`,
    error: errorOf(name),
    ...register(name),
  });

  return (
    <form onSubmit={submit} noValidate>
      <Stack gap="20px" px="24px" py="20px">
        <Text
          px="16px"
          py="12px"
          bg="#EEF3FF"
          borderWidth="1px"
          borderColor="#C7D8FF"
          rounded="12px"
          color="#1F5AFF"
          fontSize="12px"
          lineHeight="18px"
        >
          {t("OrderShipping.invoice.notice")}
        </Text>

        <Stack gap="12px">
          <SectionTitle>
            {t("OrderShipping.invoice.sections.invoice")}
          </SectionTitle>

          <Controller
            control={control}
            name="file"
            render={({ field: { onChange, value } }) => (
              <Stack gap="6px">
                <Text
                  asChild
                  color="fg.default"
                  fontSize="13px"
                  fontWeight={600}
                >
                  <label htmlFor="order-invoice-file">
                    {t("OrderShipping.invoice.fields.file")} *
                  </label>
                </Text>
                <chakra.input
                  ref={fileInput}
                  id="order-invoice-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  display="none"
                  aria-invalid={!!errors.file}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    onChange(event.target.files?.[0] ?? undefined)
                  }
                />
                <Flex align="center" gap="12px" wrap="wrap">
                  <Button
                    type="button"
                    variant="plain"
                    h="40px"
                    px="14px"
                    gap="8px"
                    rounded="12px"
                    borderWidth="1px"
                    borderColor="#E5E8EE"
                    color="#1F5AFF"
                    fontSize="13px"
                    fontWeight={600}
                    _hover={{ bg: "#F4F6F9" }}
                    onClick={() => fileInput.current?.click()}
                  >
                    <Icon as={LuFileUp} boxSize="14px" />
                    {t(
                      value
                        ? "OrderShipping.invoice.changeFile"
                        : "OrderShipping.invoice.chooseFile",
                    )}
                  </Button>
                  <Text color="#5A6478" fontSize="12px" lineHeight="18px">
                    {value instanceof File
                      ? value.name
                      : t("OrderShipping.invoice.fileHint")}
                  </Text>
                </Flex>
                {errorOf("file") && (
                  <Text role="alert" color="#EF4444" fontSize="12px">
                    {errorOf("file")}
                  </Text>
                )}
              </Stack>
            )}
          />

          <Controller
            control={control}
            name="accessKey"
            render={({ field: { onChange, value, onBlur, name } }) => (
              <Input
                id="order-invoice-accessKey"
                name={name}
                label={`${t("OrderShipping.invoice.fields.accessKey")} *`}
                inputMode="numeric"
                autoComplete="off"
                value={formatNfeAccessKey(value ?? "")}
                onChange={(event) =>
                  onChange(formatNfeAccessKey(event.target.value))
                }
                onBlur={onBlur}
                error={errorOf("accessKey")}
                helperText={
                  cnpj
                    ? t("OrderShipping.invoice.issuerCnpj", {
                        cnpj: formatCnpj(cnpj),
                      })
                    : t("OrderShipping.invoice.accessKeyHint")
                }
              />
            )}
          />

          <Input
            {...field("value")}
            inputMode="decimal"
            helperText={t("OrderShipping.invoice.valueHint")}
          />
        </Stack>

        <Stack gap="12px">
          <SectionTitle>
            {t("OrderShipping.invoice.sections.sender")}
          </SectionTitle>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="12px">
            <Input {...field("senderName")} />
            <Input {...field("stateRegister")} />
            <Input
              {...field("postalCode")}
              inputMode="numeric"
              helperText={t("OrderShipping.invoice.postalCodeHint")}
            />
            <Input {...field("address")} />
            <Input {...field("number")} />
            <Input {...field("complement", false)} />
            <Input {...field("district")} />
            <Input {...field("city")} />
            <Input {...field("stateAbbr")} maxLength={2} />
            <Input
              {...field("economicActivityCode", false)}
              inputMode="numeric"
            />
            <Input {...field("senderPhone")} type="tel" />
            <Input {...field("senderEmail")} type="email" />
          </SimpleGrid>
        </Stack>

        <Stack gap="12px">
          <SectionTitle>
            {t("OrderShipping.invoice.sections.recipient")}
          </SectionTitle>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="12px">
            <Input {...field("recipientDocument")} inputMode="numeric" />
            <Input {...field("recipientPhone")} type="tel" />
            <Input {...field("recipientEmail")} type="email" />
          </SimpleGrid>
        </Stack>
      </Stack>

      <Flex
        justify="flex-end"
        gap="8px"
        px="24px"
        py="16px"
        borderTopWidth="1px"
        borderColor="#F4F6F9"
        direction={{ base: "column-reverse", sm: "row" }}
      >
        <Button
          type="button"
          variant="plain"
          h="auto"
          px="20px"
          py="10px"
          rounded="12px"
          borderWidth="1px"
          borderColor="#E5E8EE"
          color="#5A6478"
          fontSize="13px"
          fontWeight={400}
          lineHeight="19.5px"
          _hover={{ bg: "#F4F6F9" }}
          disabled={isSubmitting || isReading}
          onClick={onCancel}
        >
          {t("OrderShipping.cancel")}
        </Button>
        <Button
          type="submit"
          h="auto"
          px="20px"
          py="10px"
          gap="8px"
          rounded="12px"
          bg="#1F5AFF"
          color="white"
          fontSize="13px"
          fontWeight={700}
          lineHeight="19.5px"
          _hover={{ bg: "#1646CC" }}
          loading={isSubmitting || isReading}
        >
          <Icon as={LuSend} boxSize="14px" />
          {t("OrderShipping.invoice.submit")}
        </Button>
      </Flex>
    </form>
  );
}
