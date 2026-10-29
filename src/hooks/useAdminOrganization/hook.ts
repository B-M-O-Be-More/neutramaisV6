"use client";

import React from "react";

import {
  adminService,
  type AdminOrganizationDetail,
  type OrganizationMembers,
} from "@/services/admin.service";
import { AuthError, ForbiddenError, NotFoundError } from "@/services/errors";

import type {
  AdminOrganizationError,
  UseAdminOrganizationReturn,
  UseOrganizationMembersReturn,
} from "./interface";

function toError(error: unknown): AdminOrganizationError {
  if (error instanceof NotFoundError) return "notFound";
  if (error instanceof AuthError || error instanceof ForbiddenError) {
    return "forbidden";
  }
  return "failed";
}

/** Última resposta recebida, marcada com a consulta que a originou. */
interface Result<T> {
  key: string;
  data: T | null;
  error: AdminOrganizationError | null;
}

/**
 * Leitura com cancelamento e "tentar de novo": a resposta só vale para a
 * consulta (id + tentativa) que a pediu.
 */
function useRead<T>(
  id: string,
  load: (id: string, signal: AbortSignal) => Promise<T>,
) {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<Result<T> | null>(null);
  const requestKey = `${id}#${attempt}`;

  React.useEffect(() => {
    const controller = new AbortController();
    load(id, controller.signal)
      .then((data) => setResult({ key: requestKey, data, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        setResult({ key: requestKey, data: null, error: toError(error) });
      });
    return () => controller.abort();
  }, [id, load, requestKey]);

  const reload = React.useCallback(() => setAttempt((n) => n + 1), []);
  const isCurrent = result?.key === requestKey;

  return {
    data: isCurrent ? result.data : null,
    isLoading: !isCurrent,
    error: isCurrent ? result.error : null,
    reload,
  };
}

const loadOrganization = (id: string, signal: AbortSignal) =>
  adminService.getOrganization(id, { signal });

const loadMembers = (id: string, signal: AbortSignal) =>
  adminService.listOrganizationMembers(id, { signal });

/** Organização do painel admin (`GET /admin/organizations/{id}`). */
export function useAdminOrganization(
  organizationId: string,
): UseAdminOrganizationReturn {
  const { data, ...rest } = useRead<AdminOrganizationDetail>(
    organizationId,
    loadOrganization,
  );
  return { organization: data, ...rest };
}

/**
 * Membros da organização (`GET /organizations/{id}/members`). A identity-api
 * só lista a organização do próprio token: para o admin, hoje, vem 403.
 */
export function useOrganizationMembers(
  organizationId: string,
): UseOrganizationMembersReturn {
  const { data, ...rest } = useRead<OrganizationMembers>(
    organizationId,
    loadMembers,
  );
  return { members: data?.items ?? [], total: data?.total ?? 0, ...rest };
}
