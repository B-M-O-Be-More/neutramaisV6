"use client";

import {
  Field,
  Grid,
  GridItem,
  Input,
  NativeSelect,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { BRAZIL_STATES, type AddressField } from "@/functions/checkoutBody";

import { CheckoutAddressFormProps } from "./interface";

const FIELDS: { field: AddressField; span: number; maxLength: number }[] = [
  { field: "recipient", span: 6, maxLength: 150 },
  { field: "postalCode", span: 2, maxLength: 9 },
  { field: "street", span: 4, maxLength: 200 },
  { field: "number", span: 2, maxLength: 20 },
  { field: "complement", span: 4, maxLength: 150 },
  { field: "district", span: 2, maxLength: 100 },
  { field: "city", span: 3, maxLength: 100 },
];

const inputStyle = {
  h: "40px",
  bg: "#F8F9FB",
  borderColor: "#E5E8EE",
  rounded: "10px",
  fontSize: "13px",
} as const;

/**
 * Endereço de entrega dos produtos físicos. A orders-api cria um pedido por
 * Seller e por endereço; aqui um endereço vale para o carrinho inteiro.
 */
export function CheckoutAddressForm({
  address,
  onChange,
  invalid,
}: CheckoutAddressFormProps) {
  const { t } = useTranslation();

  return (
    <Stack
      as="section"
      gap="14px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="16px"
      aria-labelledby="checkout-address-title"
    >
      <Stack gap="2px">
        <Text
          id="checkout-address-title"
          as="h2"
          color="#0F1729"
          fontSize="15px"
          fontWeight={700}
        >
          {t("Checkout.address.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="12px">
          {t("Checkout.address.description")}
        </Text>
      </Stack>

      <Grid templateColumns={{ base: "1fr", md: "repeat(6, 1fr)" }} gap="12px">
        {FIELDS.map(({ field, span, maxLength }) => (
          <GridItem key={field} colSpan={{ base: 1, md: span }}>
            <Field.Root
              invalid={invalid.includes(field)}
              required={field !== "complement"}
            >
              <Field.Label fontSize="12px" color="#5A6478">
                {t(`Checkout.address.fields.${field}`)}
              </Field.Label>
              <Input
                {...inputStyle}
                value={address[field]}
                maxLength={maxLength}
                inputMode={field === "postalCode" ? "numeric" : undefined}
                autoComplete={
                  field === "postalCode"
                    ? "postal-code"
                    : field === "recipient"
                      ? "name"
                      : undefined
                }
                onChange={(event) => onChange(field, event.target.value)}
              />
              <Field.ErrorText fontSize="11px">
                {t(`Checkout.address.errors.${field}`)}
              </Field.ErrorText>
            </Field.Root>
          </GridItem>
        ))}
        <GridItem colSpan={{ base: 1, md: 1 }}>
          <Field.Root invalid={invalid.includes("state")} required>
            <Field.Label fontSize="12px" color="#5A6478">
              {t("Checkout.address.fields.state")}
            </Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                {...inputStyle}
                value={address.state}
                onChange={(event) => onChange("state", event.target.value)}
              >
                <option value="">—</option>
                {BRAZIL_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <Field.ErrorText fontSize="11px">
              {t("Checkout.address.errors.state")}
            </Field.ErrorText>
          </Field.Root>
        </GridItem>
      </Grid>
    </Stack>
  );
}
