"use client";

import {
  Box,
  Button,
  Flex,
  Icon,
  Input,
  InputGroup,
  Link,
  NativeSelect,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  LuBuilding2,
  LuChevronDown,
  LuChevronRight,
  LuCircleAlert,
  LuSearch,
} from "react-icons/lu";

import {
  useAdminOrganizations,
  type AdminOrganizationsStatusFilter,
} from "@/hooks/useAdminOrganizations";
import {
  ORGANIZATION_STATUSES,
  type AdminOrganizationSummary,
  type OrganizationStatus,
  type PlatformOrganizationType,
} from "@/services/admin.service";

import { AdminUsersTabProps } from "./interface";

const TYPES: PlatformOrganizationType[] = [
  "buyer",
  "seller",
  "platform_operator",
];

const TYPE_STYLES: Record<
  PlatformOrganizationType,
  { fg: string; bg: string }
> = {
  buyer: { fg: "#1F5AFF", bg: "#EEF3FF" },
  seller: { fg: "#8B5CF6", bg: "#F3EEFF" },
  platform_operator: { fg: "#D97706", bg: "#FFFBEB" },
};

const STATUS_STYLES: Record<OrganizationStatus, { fg: string; bg: string }> = {
  pending: { fg: "#D97706", bg: "#FFFBEB" },
  active: { fg: "#10B981", bg: "#EDFBF5" },
  suspended: { fg: "#EF4444", bg: "#FEF2F2" },
  anonymized: { fg: "#5A6478", bg: "#F4F6F9" },
  taken_down: { fg: "#5A6478", bg: "#F4F6F9" },
};

// Linhas por vez: "Mostrar mais" acrescenta outra leva.
const PAGE_SIZE = 50;

const FIELD_STYLES = {
  h: "40px",
  bg: "white",
  borderWidth: "1px",
  borderColor: "#E5E8EE",
  rounded: "10px",
  fontSize: "12.5px",
  color: "#5A6478",
} as const;

const HEADER_CELL = {
  px: "16px",
  py: "12px",
  color: "#8A9AB5",
  fontSize: "10px",
  fontWeight: 700,
  lineHeight: "15px",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  borderColor: "#E5E8EE",
} as const;

const CELL = {
  px: "16px",
  py: "8px",
  h: "48px",
  borderColor: "#F0F2F7",
  color: "#5A6478",
  fontSize: "12px",
  lineHeight: "18px",
} as const;

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Busca por razão social, documento mascarado ou id. */
function matches(item: AdminOrganizationSummary, search: string): boolean {
  const query = normalize(search.trim());
  if (!query) return true;
  const digits = query.replace(/\D/g, "");
  return (
    normalize(item.legal_name).includes(query) ||
    item.id.toLowerCase().includes(query) ||
    item.tax_id_masked.toLowerCase().includes(query) ||
    (digits.length > 0 &&
      item.tax_id_masked.replace(/\D/g, "").includes(digits))
  );
}

function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(date);
}

function Badge({
  fg,
  bg,
  children,
}: { fg: string; bg: string } & {
  children: React.ReactNode;
}) {
  return (
    <Text
      as="span"
      display="inline-block"
      px="8px"
      py="2px"
      rounded="6px"
      bg={bg}
      color={fg}
      fontSize="10px"
      fontWeight={700}
      lineHeight="15px"
      textTransform="uppercase"
      whiteSpace="nowrap"
    >
      {children}
    </Text>
  );
}

/**
 * Aba Usuários do painel administrativo (Figma 2902-96251): organizações da
 * plataforma (`GET /admin/organizations`) com busca, status e tipo.
 *
 * A identity-api não lista os membros de outra organização, então a coluna
 * de usuários do Figma (contagem, nomes, ativos/suspensos) dá lugar à data
 * de cadastro, e o status é o da organização.
 */
export function AdminUsersTab({ locale }: AdminUsersTabProps) {
  const { t } = useTranslation();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] =
    React.useState<AdminOrganizationsStatusFilter>("");
  const [type, setType] = React.useState<PlatformOrganizationType | "">("");
  const [visible, setVisible] = React.useState(PAGE_SIZE);

  const { items, isLoading, error, reload } = useAdminOrganizations(status);

  const filtered = React.useMemo(
    () =>
      items.filter(
        (item) =>
          (!type || item.organization_type === type) && matches(item, search),
      ),
    [items, type, search],
  );
  const shown = filtered.slice(0, visible);

  // Filtro novo: volta à primeira leva.
  const resetVisible = () => setVisible(PAGE_SIZE);

  let body: React.ReactNode;
  if (error) {
    body = (
      <Stack align="center" gap="12px" py="40px" textAlign="center">
        <Text color="#0F1729" fontSize="13px" fontWeight={600}>
          {t(`Admin.users.errors.${error}`)}
        </Text>
        <Button
          variant="outline"
          h="34px"
          px="14px"
          rounded="10px"
          borderColor="#E5E8EE"
          color="#1F5AFF"
          fontSize="12px"
          fontWeight={600}
          onClick={reload}
        >
          {t("Admin.users.retry")}
        </Button>
      </Stack>
    );
  } else if (isLoading) {
    body = (
      <Flex justify="center" py="40px">
        <Spinner color="#1F5AFF" aria-label={t("Admin.users.loading")} />
      </Flex>
    );
  } else if (!filtered.length) {
    body = (
      <Text py="40px" textAlign="center" color="#8A9AB5" fontSize="13px">
        {t(items.length ? "Admin.users.noMatches" : "Admin.users.empty")}
      </Text>
    );
  } else {
    body = (
      <Box overflowX="auto">
        <Table.Root
          size="sm"
          minW="760px"
          aria-label={t("Admin.users.tableLabel")}
        >
          <Table.Header>
            <Table.Row bg="#F8F9FB">
              <Table.ColumnHeader {...HEADER_CELL}>
                {t("Admin.users.columns.organization")}
              </Table.ColumnHeader>
              <Table.ColumnHeader {...HEADER_CELL} textAlign="center">
                {t("Admin.users.columns.type")}
              </Table.ColumnHeader>
              <Table.ColumnHeader {...HEADER_CELL} textAlign="center">
                {t("Admin.users.columns.createdAt")}
              </Table.ColumnHeader>
              <Table.ColumnHeader {...HEADER_CELL} textAlign="center">
                {t("Admin.users.columns.status")}
              </Table.ColumnHeader>
              <Table.ColumnHeader {...HEADER_CELL} textAlign="center">
                {t("Admin.users.columns.kyc")}
              </Table.ColumnHeader>
              <Table.ColumnHeader {...HEADER_CELL} textAlign="center">
                {t("Admin.users.columns.actions")}
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {shown.map((item) => {
              const typeStyle = TYPE_STYLES[item.organization_type];
              const statusStyle =
                STATUS_STYLES[item.status] ?? STATUS_STYLES.anonymized;
              return (
                <Table.Row key={item.id} bg="white">
                  <Table.Cell {...CELL}>
                    <Flex align="center" gap="10px" minW={0}>
                      <Flex
                        boxSize="32px"
                        align="center"
                        justify="center"
                        flexShrink={0}
                        rounded="8px"
                        bg={typeStyle?.bg ?? "#F4F6F9"}
                      >
                        <Icon
                          as={LuBuilding2}
                          boxSize="14px"
                          color={typeStyle?.fg ?? "#5A6478"}
                        />
                      </Flex>
                      <Stack gap={0} minW={0}>
                        <Text
                          color="#0F1729"
                          fontSize="13px"
                          fontWeight={600}
                          lineHeight="19.5px"
                          truncate
                        >
                          {item.legal_name}
                        </Text>
                        <Text
                          color="#A0ABB8"
                          fontSize="10px"
                          lineHeight="15px"
                          truncate
                        >
                          {item.tax_id_masked}
                        </Text>
                      </Stack>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell {...CELL} textAlign="center">
                    <Badge
                      fg={typeStyle?.fg ?? "#5A6478"}
                      bg={typeStyle?.bg ?? "#F4F6F9"}
                    >
                      {t(`Admin.users.types.${item.organization_type}`, {
                        defaultValue: item.organization_type,
                      })}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell {...CELL} textAlign="center">
                    {formatDate(item.created_at, locale)}
                  </Table.Cell>
                  <Table.Cell {...CELL} textAlign="center">
                    <Badge {...statusStyle}>
                      {t(`Admin.users.statuses.${item.status}`, {
                        defaultValue: item.status,
                      })}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell {...CELL} textAlign="center">
                    {t(`Admin.organization.levels.${item.kyc_level}`, {
                      defaultValue: item.kyc_level,
                    })}
                  </Table.Cell>
                  <Table.Cell {...CELL} textAlign="center">
                    <Link
                      asChild
                      display="inline-flex"
                      p="4px"
                      rounded="8px"
                      color="#A0ABB8"
                      _hover={{ bg: "#F4F6F9", color: "#5A6478" }}
                      aria-label={t("Admin.users.open", {
                        name: item.legal_name,
                      })}
                    >
                      <NextLink href={`/admin/organizations/${item.id}`}>
                        <Icon as={LuChevronRight} boxSize="16px" />
                      </NextLink>
                    </Link>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>
    );
  }

  return (
    <Stack gap="16px">
      <Flex
        align="flex-start"
        gap="12px"
        px="20px"
        py="14px"
        bg="#FFFBEB"
        borderWidth="1px"
        borderColor="#FDE68A"
        rounded="12px"
      >
        <Icon
          as={LuCircleAlert}
          boxSize="14px"
          color="#D97706"
          mt="2px"
          flexShrink={0}
        />
        <Text color="#92400E" fontSize="12px" lineHeight="18px">
          {t("Admin.users.notice")}
        </Text>
      </Flex>

      <Flex align="center" gap="8px" wrap={{ base: "wrap", md: "nowrap" }}>
        <InputGroup
          w={{ base: "full", md: "256px" }}
          flexShrink={0}
          startElement={<Icon as={LuSearch} boxSize="13px" color="#A0ABB8" />}
          startElementProps={{ ps: "12px" }}
        >
          <Input
            id="admin-users-search"
            type="search"
            value={search}
            maxLength={100}
            onChange={(event) => {
              setSearch(event.target.value);
              resetVisible();
            }}
            placeholder={t("Admin.filters.searchPlaceholder")}
            aria-label={t("Admin.filters.search")}
            ps="33px"
            _placeholder={{ color: "#C0C9D8" }}
            {...FIELD_STYLES}
          />
        </InputGroup>

        <NativeSelect.Root w="auto" flexShrink={0}>
          <NativeSelect.Field
            id="admin-users-status"
            aria-label={t("Admin.filters.statusLabel")}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as AdminOrganizationsStatusFilter);
              resetVisible();
            }}
            ps="12px"
            pe="32px"
            {...FIELD_STYLES}
          >
            <option value="">
              {t("Admin.filters.status", { value: t("Admin.filters.all") })}
            </option>
            {ORGANIZATION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {t("Admin.filters.status", {
                  value: t(`Admin.users.statuses.${value}`),
                })}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator>
            <LuChevronDown color="#A0ABB8" />
          </NativeSelect.Indicator>
        </NativeSelect.Root>

        <NativeSelect.Root w="auto" flexShrink={0}>
          <NativeSelect.Field
            id="admin-users-type"
            aria-label={t("Admin.filters.typeLabel")}
            value={type}
            onChange={(event) => {
              setType(event.target.value as PlatformOrganizationType | "");
              resetVisible();
            }}
            ps="12px"
            pe="32px"
            {...FIELD_STYLES}
          >
            <option value="">
              {t("Admin.filters.type", { value: t("Admin.filters.all") })}
            </option>
            {TYPES.map((value) => (
              <option key={value} value={value}>
                {t("Admin.filters.type", {
                  value: t(`Admin.users.types.${value}`),
                })}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator>
            <LuChevronDown color="#A0ABB8" />
          </NativeSelect.Indicator>
        </NativeSelect.Root>

        {!isLoading && !error && (
          <Text
            color="#C0C9D8"
            fontSize="12px"
            lineHeight="18px"
            flexShrink={0}
            aria-live="polite"
          >
            {t("Admin.users.count", {
              shown: filtered.length,
              total: items.length,
            })}
          </Text>
        )}
      </Flex>

      <Box
        bg="white"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="16px"
        overflow="hidden"
      >
        {body}
      </Box>

      {!error && !isLoading && filtered.length > shown.length && (
        <Button
          alignSelf="center"
          variant="outline"
          h="36px"
          px="16px"
          rounded="10px"
          borderColor="#E5E8EE"
          color="#1F5AFF"
          fontSize="13px"
          fontWeight={600}
          onClick={() => setVisible((current) => current + PAGE_SIZE)}
        >
          {t("Admin.users.showMore", {
            count: filtered.length - shown.length,
          })}
        </Button>
      )}
    </Stack>
  );
}
