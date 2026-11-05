"use client";

import {
  Button,
  Checkbox,
  Field,
  Flex,
  Input,
  NativeSelect,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuChevronDown } from "react-icons/lu";

import OfferMaskedInput, { MONEY_MASK } from "@/components/OfferMaskedInput";
import { toApiDecimal } from "@/functions/buildOfferingPayload";
import { parseDecimal } from "@/functions/parseDecimal";
import { useOfferingPrices } from "@/hooks/useOfferingPrices";
import {
  OFFERING_PRICE_TYPES,
  type OfferingPrice,
  type OfferingPriceType,
} from "@/services/offeringPrices.service";

import { SellerOfferPricesProps } from "./interface";

/** Quantidade inteira a partir de 1; vazio = null. */
const quantityOf = (value: string) =>
  /^\d+$/.test(value.trim()) && Number(value) >= 1 ? Number(value) : null;

interface NewPrice {
  priceType: OfferingPriceType;
  amount: string;
  minQuantity: string;
  maxQuantity: string;
}

const EMPTY_PRICE: NewPrice = {
  priceType: "recurring",
  amount: "",
  minQuantity: "1",
  maxQuantity: "",
};

/**
 * Preços da oferta (D-20, TMF620 ProductOfferingPrice): os ativos por tipo e
 * faixa de quantidade e, a pedido, o histórico dos encerrados. Com
 * `price:change`, o seller adiciona uma faixa, altera o valor (a API encerra
 * o preço e cria outro, com ID novo) e encerra um preço. A moeda é a da
 * oferta: todos os preços ativos usam uma só.
 */
export function SellerOfferPrices({
  offeringId,
  currency,
  locale,
  canEdit,
  onChanged,
}: SellerOfferPricesProps) {
  const { t } = useTranslation();
  const [history, setHistory] = React.useState(false);
  const prices = useOfferingPrices(offeringId, { history, onChanged });
  const [editing, setEditing] = React.useState<{
    id: string;
    amount: string;
  } | null>(null);
  const [ending, setEnding] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<NewPrice>(EMPTY_PRICE);

  const money = (amount: string) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(
      Number(amount),
    );
  const date = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(
      new Date(iso),
    );
  const range = (price: OfferingPrice) =>
    price.maxQuantity === null
      ? t("SellerOfferPrices.rangeOpen", { min: price.minQuantity })
      : t("SellerOfferPrices.range", {
          min: price.minQuantity,
          max: price.maxQuantity,
        });

  const minQuantity = quantityOf(draft.minQuantity);
  const maxQuantity = draft.maxQuantity.trim()
    ? quantityOf(draft.maxQuantity)
    : null;
  const amount = parseDecimal(draft.amount);
  const draftInvalid =
    minQuantity === null ||
    (draft.maxQuantity.trim() !== "" &&
      (maxQuantity === null || maxQuantity < minQuantity)) ||
    amount === null;

  const addPrice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (draftInvalid) return;
    const ok = await prices.create({
      priceType: draft.priceType,
      currency,
      amount: toApiDecimal(draft.amount),
      ...(draft.priceType === "recurring"
        ? { recurringPeriod: "month" as const }
        : {}),
      minQuantity: minQuantity!,
      maxQuantity,
    });
    if (ok) setDraft(EMPTY_PRICE);
  };

  const saveAmount = async () => {
    if (!editing || parseDecimal(editing.amount) === null) return;
    const ok = await prices.update(editing.id, {
      amount: toApiDecimal(editing.amount),
    });
    if (ok) setEditing(null);
  };

  const endPrice = async (priceId: string) => {
    const ok = await prices.end(priceId);
    if (ok) setEnding(null);
  };

  return (
    <Stack
      as="section"
      aria-labelledby="offer-prices-title"
      gap="16px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <Flex align="flex-start" justify="space-between" gap="12px" wrap="wrap">
        <Stack gap="2px">
          <Text
            as="h2"
            id="offer-prices-title"
            color="#0F1729"
            fontSize="15px"
            fontWeight={700}
            lineHeight="22.5px"
          >
            {t("SellerOfferPrices.title")}
          </Text>
          <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
            {t("SellerOfferPrices.subtitle", { currency })}
          </Text>
        </Stack>
        <Checkbox.Root
          checked={history}
          onCheckedChange={(details) => setHistory(!!details.checked)}
          size="sm"
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label fontSize="13px" color="#5A6478">
            {t("SellerOfferPrices.showHistory")}
          </Checkbox.Label>
        </Checkbox.Root>
      </Flex>

      {prices.isLoading && prices.prices.length === 0 ? (
        <Text color="#5A6478" fontSize="13px" role="status">
          {t("SellerOfferPrices.loading")}
        </Text>
      ) : prices.loadErrorKey ? (
        <Flex align="center" gap="12px" wrap="wrap">
          <Text color="#B91C1C" fontSize="13px" role="alert">
            {t(prices.loadErrorKey)}
          </Text>
          <Button
            variant="outline"
            size="sm"
            rounded="10px"
            onClick={prices.reload}
          >
            {t("SellerOfferPrices.retry")}
          </Button>
        </Flex>
      ) : prices.prices.length === 0 ? (
        <Text color="#8A9AB5" fontSize="13px">
          {t("SellerOfferPrices.empty")}
        </Text>
      ) : (
        <Table.ScrollArea
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="10px"
        >
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row bg="#F8F9FB">
                <Table.ColumnHeader>
                  {t("SellerOfferPrices.columns.type")}
                </Table.ColumnHeader>
                <Table.ColumnHeader>
                  {t("SellerOfferPrices.columns.range")}
                </Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">
                  {t("SellerOfferPrices.columns.amount")}
                </Table.ColumnHeader>
                <Table.ColumnHeader>
                  {t("SellerOfferPrices.columns.validity")}
                </Table.ColumnHeader>
                {canEdit && (
                  <Table.ColumnHeader>
                    <Text srOnly>{t("SellerOfferPrices.columns.actions")}</Text>
                  </Table.ColumnHeader>
                )}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {prices.prices.map((price) => {
                const active = price.validTo === null;
                const isEditing = editing?.id === price.id;
                const isPending = prices.pendingId === price.id;
                return (
                  <Table.Row key={price.id} opacity={active ? 1 : 0.6}>
                    <Table.Cell>
                      {t(`SellerOfferPrices.types.${price.priceType}`)}
                    </Table.Cell>
                    <Table.Cell>{range(price)}</Table.Cell>
                    <Table.Cell
                      textAlign="end"
                      fontVariantNumeric="tabular-nums"
                    >
                      {isEditing ? (
                        <OfferMaskedInput
                          maskOptions={MONEY_MASK}
                          value={editing.amount}
                          onAccept={(value: string) =>
                            setEditing({ id: price.id, amount: value })
                          }
                          aria-label={t("SellerOfferPrices.newAmount")}
                          h="32px"
                          w="120px"
                          fontSize="13px"
                          textAlign="end"
                        />
                      ) : (
                        money(price.amount)
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {active
                        ? t("SellerOfferPrices.since", {
                            date: date(price.validFrom),
                          })
                        : t("SellerOfferPrices.between", {
                            from: date(price.validFrom),
                            to: date(price.validTo!),
                          })}
                    </Table.Cell>
                    {canEdit && (
                      <Table.Cell>
                        {active && (
                          <Flex gap="6px" justify="flex-end" wrap="wrap">
                            {isEditing ? (
                              <>
                                <Button
                                  size="xs"
                                  rounded="8px"
                                  bg="#1F5AFF"
                                  color="white"
                                  loading={isPending}
                                  onClick={saveAmount}
                                >
                                  {t("SellerOfferPrices.save")}
                                </Button>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  rounded="8px"
                                  disabled={isPending}
                                  onClick={() => setEditing(null)}
                                >
                                  {t("SellerOfferPrices.cancel")}
                                </Button>
                              </>
                            ) : ending === price.id ? (
                              <>
                                <Button
                                  size="xs"
                                  rounded="8px"
                                  bg="#EF4444"
                                  color="white"
                                  loading={isPending}
                                  onClick={() => endPrice(price.id)}
                                >
                                  {t("SellerOfferPrices.confirmEnd")}
                                </Button>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  rounded="8px"
                                  disabled={isPending}
                                  onClick={() => setEnding(null)}
                                >
                                  {t("SellerOfferPrices.cancel")}
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  rounded="8px"
                                  onClick={() =>
                                    setEditing({
                                      id: price.id,
                                      amount: new Intl.NumberFormat("pt-BR", {
                                        minimumFractionDigits: 2,
                                      }).format(Number(price.amount)),
                                    })
                                  }
                                >
                                  {t("SellerOfferPrices.edit")}
                                </Button>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  rounded="8px"
                                  color="#B91C1C"
                                  onClick={() => setEnding(price.id)}
                                >
                                  {t("SellerOfferPrices.end")}
                                </Button>
                              </>
                            )}
                          </Flex>
                        )}
                      </Table.Cell>
                    )}
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      )}

      {canEdit && (
        <form onSubmit={addPrice} noValidate>
          <Stack
            gap="12px"
            p="14px"
            bg="#F8F9FB"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="12px"
          >
            <Text color="#0F1729" fontSize="13px" fontWeight={700}>
              {t("SellerOfferPrices.add.title")}
            </Text>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="10px">
              <Field.Root>
                <Field.Label fontSize="12px" color="#5A6478">
                  {t("SellerOfferPrices.add.type")}
                </Field.Label>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={draft.priceType}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        priceType: event.target.value as OfferingPriceType,
                      })
                    }
                    bg="white"
                    rounded="8px"
                  >
                    {OFFERING_PRICE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {t(`SellerOfferPrices.types.${type}`)}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator>
                    <LuChevronDown color="#98A6B3" />
                  </NativeSelect.Indicator>
                </NativeSelect.Root>
              </Field.Root>
              <Field.Root invalid={!!draft.amount && amount === null}>
                <Field.Label fontSize="12px" color="#5A6478">
                  {t("SellerOfferPrices.add.amount", { currency })}
                </Field.Label>
                <OfferMaskedInput
                  maskOptions={MONEY_MASK}
                  value={draft.amount}
                  onAccept={(value: string) =>
                    setDraft({ ...draft, amount: value })
                  }
                  placeholder="0,00"
                  h="32px"
                  fontSize="13px"
                  bg="white"
                  rounded="8px"
                />
              </Field.Root>
              <Field.Root invalid={minQuantity === null}>
                <Field.Label fontSize="12px" color="#5A6478">
                  {t("SellerOfferPrices.add.minQuantity")}
                </Field.Label>
                <Input
                  size="sm"
                  inputMode="numeric"
                  value={draft.minQuantity}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      minQuantity: event.target.value.replace(/\D/g, ""),
                    })
                  }
                  bg="white"
                  rounded="8px"
                />
              </Field.Root>
              <Field.Root
                invalid={
                  draft.maxQuantity.trim() !== "" &&
                  (maxQuantity === null ||
                    (minQuantity !== null && maxQuantity < minQuantity))
                }
              >
                <Field.Label fontSize="12px" color="#5A6478">
                  {t("SellerOfferPrices.add.maxQuantity")}
                </Field.Label>
                <Input
                  size="sm"
                  inputMode="numeric"
                  value={draft.maxQuantity}
                  placeholder={t("SellerOfferPrices.add.noMax")}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      maxQuantity: event.target.value.replace(/\D/g, ""),
                    })
                  }
                  bg="white"
                  rounded="8px"
                />
              </Field.Root>
            </SimpleGrid>
            <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
              {t("SellerOfferPrices.add.hint")}
            </Text>
            <Flex>
              <Button
                type="submit"
                size="sm"
                rounded="10px"
                bg="#1F5AFF"
                color="white"
                disabled={draftInvalid}
                loading={prices.pendingId === "create"}
                _hover={{ bg: "#1646CC" }}
              >
                {t("SellerOfferPrices.add.submit")}
              </Button>
            </Flex>
          </Stack>
        </form>
      )}

      {prices.actionErrorKey && (
        <Text color="#B91C1C" fontSize="12px" role="alert">
          {t(prices.actionErrorKey)}
        </Text>
      )}
    </Stack>
  );
}
