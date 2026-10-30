"use client";

import {
  Box,
  Button,
  Flex,
  Grid,
  Icon,
  Input,
  InputGroup,
  Link,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  LuArrowLeft,
  LuBuilding2,
  LuChevronDown,
  LuChevronRight,
  LuChevronUp,
  LuCircleAlert,
  LuSearch,
  LuSlidersHorizontal,
  LuUsers,
} from "react-icons/lu";

import StorageQuotaDialog from "@/components/StorageQuotaDialog";
import { useSession } from "@/contexts/SessionContext";
import { formatMegabytes } from "@/functions/formatMegabytes";
import { isSuperAdmin } from "@/functions/rolesToPersonas";
import {
  useAdminOrganization,
  useOrganizationMembers,
} from "@/hooks/useAdminOrganization";
import { useOrganizationStorage } from "@/hooks/useOrganizationStorage";
import type {
  OrganizationMember,
  OrganizationStatus,
  PlatformOrganizationType,
} from "@/services/admin.service";

import { AdminOrganizationDetailProps } from "./interface";

const TYPE_STYLES: Record<
  PlatformOrganizationType,
  { fg: string; bg: string }
> = {
  buyer: { fg: "#1F5AFF", bg: "#EEF3FF" },
  seller: { fg: "#8B5CF6", bg: "#F3EEFF" },
  platform_operator: { fg: "#D97706", bg: "#FFFBEB" },
};
const NEUTRAL = { fg: "#5A6478", bg: "#F4F6F9" };

const ORGANIZATION_STATUS_STYLES: Record<
  OrganizationStatus,
  { fg: string; bg: string }
> = {
  pending: { fg: "#D97706", bg: "#FFFBEB" },
  active: { fg: "#10B981", bg: "#EDFBF5" },
  suspended: { fg: "#EF4444", bg: "#FEF2F2" },
  anonymized: NEUTRAL,
  taken_down: NEUTRAL,
};

const MEMBER_STATUS_STYLES: Record<string, { fg: string; bg: string }> = {
  active: { fg: "#10B981", bg: "#EDFBF5" },
  suspended: { fg: "#EF4444", bg: "#FEF2F2" },
  pending: { fg: "#D97706", bg: "#FFFBEB" },
};

const card = {
  bg: "white",
  borderWidth: "1px",
  borderColor: "#E5E8EE",
  rounded: "12px",
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

function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(date);
}

function Badge({
  fg,
  bg,
  children,
}: {
  fg: string;
  bg: string;
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

/** Número do cabeçalho (Usuários, Ativos, Suspensos), com borda na cor. */
function Counter({
  value,
  label,
  color,
}: {
  value: number | null;
  label: string;
  color: string;
}) {
  return (
    <Stack
      align="center"
      gap={0}
      minW="76px"
      px="16px"
      py="8px"
      borderWidth="1px"
      borderColor={color}
      rounded="11px"
    >
      <Text color={color} fontSize="22px" fontWeight={800} lineHeight="28px">
        {value ?? "—"}
      </Text>
      <Text color="#8A9AB5" fontSize="11px" lineHeight="16.5px">
        {label}
      </Text>
    </Stack>
  );
}

/**
 * Página de uma organização no painel admin (Figma 2902-97789), aberta pela
 * aba Usuários: dados da empresa (`GET /admin/organizations/{id}`), membros
 * (`GET /organizations/{id}/members`) e cota de armazenamento de cobertura.
 *
 * Fora do Figma, por falta de dados no backend: avaliação, último acesso,
 * telefone, setor, endereço, outorga SCM, resumo de ofertas e a suspensão
 * ou reativação de usuários.
 */
export function AdminOrganizationDetail({
  organizationId,
  locale,
}: AdminOrganizationDetailProps) {
  const { t } = useTranslation();
  const { profile } = useSession();
  // A cota de outra organização só o super_admin lê e altera.
  const canManageStorage = isSuperAdmin(profile?.roles ?? []);

  const { organization, isLoading, error, reload } =
    useAdminOrganization(organizationId);
  const members = useOrganizationMembers(organizationId);
  const quota = useOrganizationStorage(
    canManageStorage ? organizationId : null,
  );

  const [infoOpen, setInfoOpen] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [editingQuota, setEditingQuota] = React.useState(false);

  const backLink = (
    <Link
      asChild
      alignSelf="flex-start"
      color="#8A9AB5"
      fontSize="13px"
      gap="6px"
      _hover={{ color: "#5A6478" }}
    >
      <NextLink href="/admin?tab=users">
        <Icon as={LuArrowLeft} boxSize="13px" />
        {t("Admin.organizationDetail.back")}
      </NextLink>
    </Link>
  );

  if (error || isLoading || !organization) {
    return (
      <Stack gap="16px">
        {backLink}
        {error ? (
          <Stack
            align="center"
            gap="12px"
            py="40px"
            textAlign="center"
            {...card}
          >
            <Text color="#0F1729" fontSize="13px" fontWeight={600}>
              {t(`Admin.organizationDetail.errors.${error}`)}
            </Text>
            {error !== "notFound" && (
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
                {t("Admin.organizationDetail.retry")}
              </Button>
            )}
          </Stack>
        ) : (
          <Flex justify="center" py="48px">
            <Spinner
              color="#1F5AFF"
              size="lg"
              aria-label={t("Admin.organizationDetail.loading")}
            />
          </Flex>
        )}
      </Stack>
    );
  }

  // Nome de exibição: o fantasia, quando houver; a razão social fica nas
  // informações da empresa.
  const displayName = organization.trade_name || organization.legal_name;
  const typeStyle = TYPE_STYLES[organization.organization_type] ?? NEUTRAL;
  const typeLabel = t(`Admin.users.types.${organization.organization_type}`, {
    defaultValue: organization.organization_type,
  });
  const levelLabel = t(`Admin.organization.levels.${organization.kyc_level}`, {
    defaultValue: organization.kyc_level,
  });
  const statusStyle =
    ORGANIZATION_STATUS_STYLES[organization.status] ?? NEUTRAL;

  // Contagens só quando a lista de membros veio.
  const counted = !members.isLoading && !members.error;
  const countBy = (status: string) =>
    counted
      ? members.members.filter((member) => member.status === status).length
      : null;

  const info = [
    { key: "legalName", value: organization.legal_name },
    { key: "tradeName", value: organization.trade_name },
    { key: "taxId", value: organization.tax_id_masked },
    { key: "contactEmail", value: organization.contact_email },
    { key: "country", value: organization.country_code },
    {
      key: "kyc",
      value: organization.kyc_state
        ? `${levelLabel} · ${t(
            `Admin.organizationDetail.kycStates.${organization.kyc_state}`,
            { defaultValue: organization.kyc_state },
          )}`
        : levelLabel,
    },
    {
      key: "status",
      value: t(`Admin.users.statuses.${organization.status}`, {
        defaultValue: organization.status,
      }),
    },
    { key: "createdAt", value: formatDate(organization.created_at, locale) },
    {
      key: "suspendedReason",
      value: organization.suspended_reason
        ? `${organization.suspended_reason} · ${formatDate(
            organization.suspended_at,
            locale,
          )}`
        : null,
    },
  ].filter((row): row is { key: string; value: string } => !!row.value);

  const query = normalize(search.trim());
  const visibleMembers = members.members.filter(
    (member: OrganizationMember) =>
      !query ||
      normalize(member.email ?? "").includes(query) ||
      member.user_id.toLowerCase().includes(query),
  );

  let membersBody: React.ReactNode;
  if (members.error) {
    membersBody = (
      <Stack align="center" gap="12px" py="32px" px="16px" textAlign="center">
        <Text color="#5A6478" fontSize="13px" maxW="560px">
          {t(`Admin.organizationDetail.members.errors.${members.error}`)}
        </Text>
        {members.error === "failed" && (
          <Button
            variant="outline"
            h="34px"
            px="14px"
            rounded="10px"
            borderColor="#E5E8EE"
            color="#1F5AFF"
            fontSize="12px"
            fontWeight={600}
            onClick={members.reload}
          >
            {t("Admin.organizationDetail.retry")}
          </Button>
        )}
      </Stack>
    );
  } else if (members.isLoading) {
    membersBody = (
      <Flex justify="center" py="32px">
        <Spinner
          color="#1F5AFF"
          aria-label={t("Admin.organizationDetail.members.loading")}
        />
      </Flex>
    );
  } else if (!visibleMembers.length) {
    membersBody = (
      <Text py="32px" textAlign="center" color="#8A9AB5" fontSize="13px">
        {t(
          members.members.length
            ? "Admin.organizationDetail.members.noMatches"
            : "Admin.organizationDetail.members.empty",
        )}
      </Text>
    );
  } else {
    membersBody = (
      <Box overflowX="auto">
        <Table.Root
          size="sm"
          minW="640px"
          aria-label={t("Admin.organizationDetail.members.tableLabel")}
        >
          <Table.Header>
            <Table.Row bg="#F8F9FB">
              <Table.ColumnHeader {...HEADER_CELL}>
                {t("Admin.organizationDetail.members.columns.user")}
              </Table.ColumnHeader>
              <Table.ColumnHeader {...HEADER_CELL}>
                {t("Admin.organizationDetail.members.columns.email")}
              </Table.ColumnHeader>
              <Table.ColumnHeader {...HEADER_CELL} textAlign="center">
                {t("Admin.organizationDetail.members.columns.role")}
              </Table.ColumnHeader>
              <Table.ColumnHeader {...HEADER_CELL} textAlign="center">
                {t("Admin.organizationDetail.members.columns.status")}
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {visibleMembers.map((member) => {
              const memberStatus = member.status
                ? (MEMBER_STATUS_STYLES[member.status] ?? NEUTRAL)
                : null;
              return (
                <Table.Row key={member.user_id} bg="white">
                  <Table.Cell {...CELL}>
                    <Flex align="center" gap="10px">
                      <Flex
                        boxSize="32px"
                        align="center"
                        justify="center"
                        flexShrink={0}
                        rounded="8px"
                        bg="#EEF3FF"
                      >
                        <Icon as={LuUsers} boxSize="14px" color="#1F5AFF" />
                      </Flex>
                      <Stack gap={0}>
                        <Text
                          color="#0F1729"
                          fontSize="13px"
                          fontWeight={600}
                          lineHeight="19.5px"
                          fontFamily="mono"
                        >
                          {member.user_id.slice(0, 8)}
                        </Text>
                        {member.joined_at && (
                          <Text
                            color="#A0ABB8"
                            fontSize="10px"
                            lineHeight="15px"
                          >
                            {t("Admin.organizationDetail.members.joinedAt", {
                              date: formatDate(member.joined_at, locale),
                            })}
                          </Text>
                        )}
                      </Stack>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell {...CELL} maxW="260px">
                    <Text truncate>{member.email || "—"}</Text>
                  </Table.Cell>
                  <Table.Cell {...CELL} textAlign="center">
                    {t(`Admin.organizationDetail.roles.${member.role}`, {
                      defaultValue: member.role,
                    })}
                  </Table.Cell>
                  <Table.Cell {...CELL} textAlign="center">
                    {memberStatus ? (
                      <Badge {...memberStatus}>
                        {t(
                          `Admin.organizationDetail.members.statuses.${member.status}`,
                          { defaultValue: member.status },
                        )}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>
    );
  }

  const storage = quota.storage;
  const storagePercent =
    storage && storage.quotaMb > 0
      ? Math.min(100, (storage.usedMb / storage.quotaMb) * 100)
      : storage?.usedMb
        ? 100
        : 0;

  return (
    <Stack gap="16px">
      {/* Trilha: volta para a lista da aba Usuários. */}
      <Flex
        as="nav"
        aria-label={t("Admin.organizationDetail.breadcrumb")}
        align="center"
        gap="6px"
      >
        {backLink}
        <Icon as={LuChevronRight} boxSize="12px" color="#A0ABB8" />
        <Text
          color="#0F1729"
          fontSize="13px"
          fontWeight={700}
          aria-current="page"
          truncate
        >
          {displayName}
        </Text>
      </Flex>

      {/* Cabeçalho: organização, contagens de usuários e cota. */}
      <Flex
        {...card}
        px="20px"
        py="16px"
        gap="16px"
        align="center"
        wrap={{ base: "wrap", lg: "nowrap" }}
      >
        <Flex
          boxSize="44px"
          align="center"
          justify="center"
          flexShrink={0}
          rounded="12px"
          bg={typeStyle.bg}
        >
          <Icon as={LuBuilding2} boxSize="20px" color={typeStyle.fg} />
        </Flex>

        <Stack gap="2px" flex="1" minW={0}>
          <Flex align="center" gap="8px" wrap="wrap">
            <Text
              as="h2"
              color="#0F1729"
              fontSize="18px"
              fontWeight={800}
              lineHeight="26px"
            >
              {displayName}
            </Text>
            <Badge {...typeStyle}>{typeLabel}</Badge>
            <Badge {...statusStyle}>
              {t(`Admin.users.statuses.${organization.status}`, {
                defaultValue: organization.status,
              })}
            </Badge>
          </Flex>
          <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
            {t("Admin.organizationDetail.summary", {
              level: levelLabel,
              date: formatDate(organization.created_at, locale),
            })}
          </Text>
        </Stack>

        <Flex gap="10px" wrap="wrap" align="stretch">
          <Counter
            value={counted ? members.total : null}
            label={t("Admin.organizationDetail.counters.users")}
            color="#1F5AFF"
          />
          <Counter
            value={countBy("active")}
            label={t("Admin.organizationDetail.counters.active")}
            color="#10B981"
          />
          <Counter
            value={countBy("suspended")}
            label={t("Admin.organizationDetail.counters.suspended")}
            color="#EF4444"
          />
          {storage && (
            <Stack
              gap="6px"
              minW="160px"
              px="16px"
              py="8px"
              borderWidth="1px"
              borderColor="#1F5AFF"
              rounded="11px"
            >
              <Flex justify="space-between" align="baseline" gap="8px">
                <Text color="#0F1729" fontSize="12px" fontWeight={700}>
                  {formatMegabytes(storage.quotaMb, locale)}
                </Text>
                <Text color="#8A9AB5" fontSize="10px">
                  {t("Admin.organizationDetail.storage.used", {
                    used: formatMegabytes(storage.usedMb, locale),
                  })}
                </Text>
              </Flex>
              <Box
                role="progressbar"
                aria-label={t("Admin.organizationDetail.storage.label")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(storagePercent)}
                h="6px"
                bg="#F4F6F9"
                rounded="full"
                overflow="hidden"
              >
                <Box
                  h="full"
                  w={`${storagePercent}%`}
                  bg={storage.overQuota ? "#EF4444" : "#1F5AFF"}
                  rounded="full"
                />
              </Box>
              <Text color="#8A9AB5" fontSize="11px" lineHeight="16.5px">
                {t("Admin.organizationDetail.storage.label")}
              </Text>
            </Stack>
          )}
        </Flex>
      </Flex>

      {/* Informações da empresa, recolhível. */}
      <Stack
        as="section"
        aria-labelledby="organization-info-title"
        gap="12px"
        px="16px"
        pt="8px"
        pb={infoOpen ? "20px" : "8px"}
        bg="white"
        borderWidth="1px"
        borderColor="#1F5AFF"
        rounded="12px"
      >
        <Flex align="center" justify="space-between" gap="12px">
          <Text
            id="organization-info-title"
            as="h2"
            color="#0F1729"
            fontSize="16px"
            fontWeight={700}
            lineHeight="26px"
          >
            {t("Admin.organizationDetail.info.title", {
              name: displayName,
            })}
          </Text>
          <Button
            variant="plain"
            boxSize="32px"
            minW="32px"
            p={0}
            color="#1F5AFF"
            aria-expanded={infoOpen}
            aria-controls="organization-info"
            aria-label={t(
              infoOpen
                ? "Admin.organizationDetail.info.collapse"
                : "Admin.organizationDetail.info.expand",
            )}
            onClick={() => setInfoOpen((open) => !open)}
          >
            <Icon as={infoOpen ? LuChevronUp : LuChevronDown} boxSize="18px" />
          </Button>
        </Flex>
        {infoOpen && (
          <Grid
            id="organization-info"
            as="dl"
            templateColumns={{
              base: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            }}
            gap="12px"
          >
            {info.map((row) => (
              <Stack
                key={row.key}
                gap="2px"
                p="10px"
                bg="#F8F9FB"
                borderWidth="1px"
                borderColor="#E5E8EE"
                rounded="8px"
                minW={0}
              >
                <Text
                  as="dt"
                  color="#8A9AB5"
                  fontSize="9px"
                  fontWeight={700}
                  lineHeight="13.5px"
                  letterSpacing="0.5px"
                  textTransform="uppercase"
                >
                  {t(`Admin.organizationDetail.info.fields.${row.key}`)}
                </Text>
                <Text
                  as="dd"
                  color="#0F1729"
                  fontSize="12px"
                  fontWeight={600}
                  lineHeight="18px"
                  wordBreak="break-word"
                >
                  {row.value}
                </Text>
              </Stack>
            ))}
          </Grid>
        )}
      </Stack>

      {/* Usuários da organização: busca e "Atualizar cotas". */}
      <Flex align="center" gap="12px" wrap={{ base: "wrap", md: "nowrap" }}>
        <InputGroup
          w={{ base: "full", md: "384px" }}
          flexShrink={0}
          startElement={<Icon as={LuSearch} boxSize="14px" color="#A0ABB8" />}
          startElementProps={{ ps: "12px" }}
        >
          <Input
            id="organization-members-search"
            type="search"
            value={search}
            maxLength={100}
            disabled={!!members.error}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t(
              "Admin.organizationDetail.members.searchPlaceholder",
            )}
            aria-label={t("Admin.organizationDetail.members.search")}
            h="38px"
            ps="36px"
            bg="white"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="10px"
            fontSize="13px"
            color="#5A6478"
            _placeholder={{ color: "#8A9AB5" }}
          />
        </InputGroup>
        {storage && (
          <Button
            h="40px"
            px="16px"
            gap="8px"
            rounded="12px"
            bg="#EEF3FF"
            borderWidth="1px"
            borderColor="#C7D8FF"
            color="#1F5AFF"
            fontSize="13px"
            fontWeight={700}
            _hover={{ bg: "#E0E9FF" }}
            onClick={() => setEditingQuota(true)}
          >
            <Icon as={LuSlidersHorizontal} boxSize="14px" />
            {t("Admin.organizationDetail.updateQuota")}
          </Button>
        )}
      </Flex>

      <Box {...card} rounded="16px" overflow="hidden">
        {membersBody}
      </Box>

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

      <StorageQuotaDialog
        open={editingQuota}
        onClose={() => setEditingQuota(false)}
        quota={quota}
        organizationName={organization.legal_name}
        locale={locale}
      />
    </Stack>
  );
}
