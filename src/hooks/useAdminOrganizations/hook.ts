"use client";

import React from "react";

import {
  adminService,
  ORGANIZATION_STATUSES,
  type AdminOrganizationSummary,
  type OrganizationStatus,
} from "@/services/admin.service";
import { AuthError, ForbiddenError } from "@/services/errors";

import type {
  AdminOrganizationsError,
  AdminOrganizationsStatusFilter,
  UseAdminOrganizationsReturn,
} from "./interface";

// Maior página aceita pela identity-api.
const PAGE_SIZE = 200;

/** Todas as páginas de um status. */
async function loadStatus(
  status: OrganizationStatus,
  signal: AbortSignal,
): Promise<AdminOrganizationSummary[]> {
  const items: AdminOrganizationSummary[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await adminService.listOrganizations(
      { status, limit: PAGE_SIZE, offset },
      { signal },
    );
    items.push(...page.items);
    if (!page.items.length || items.length >= page.total) return items;
  }
}

/** Última resposta recebida, marcada com a consulta que a originou. */
interface OrganizationsResult {
  key: string;
  items: AdminOrganizationSummary[];
  error: AdminOrganizationsError | null;
}

/**
 * Organizações da plataforma para a aba Usuários do admin
 * (`GET /admin/organizations`). O upstream filtra só por um status, sem
 * busca nem tipo: aqui se carregam todas as páginas dos status pedidos — os
 * cinco, quando o filtro é "Todos" — e a tela filtra o resto.
 */
export function useAdminOrganizations(
  status: AdminOrganizationsStatusFilter,
): UseAdminOrganizationsReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<OrganizationsResult | null>(null);

  const requestKey = `${status}#${attempt}`;

  React.useEffect(() => {
    const controller = new AbortController();
    const statuses = status ? [status] : [...ORGANIZATION_STATUSES];

    Promise.all(statuses.map((item) => loadStatus(item, controller.signal)))
      .then((pages) => {
        const items = pages
          .flat()
          .sort((a, b) => b.created_at.localeCompare(a.created_at));
        setResult({ key: requestKey, items, error: null });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setResult({
          key: requestKey,
          items: [],
          error:
            error instanceof AuthError || error instanceof ForbiddenError
              ? "forbidden"
              : "failed",
        });
      });

    return () => controller.abort();
  }, [status, requestKey]);

  const reload = React.useCallback(() => setAttempt((n) => n + 1), []);

  const isCurrent = result?.key === requestKey;

  return {
    items: isCurrent ? result.items : [],
    isLoading: !isCurrent,
    error: isCurrent ? result.error : null,
    reload,
  };
}
