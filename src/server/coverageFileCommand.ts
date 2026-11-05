import "server-only";

import { isUuid } from "@/server/complianceProxy";

// Corpo comum dos comandos de ciclo de vida de um arquivo de cobertura
// (archive/restore na geo-api): organização, o `previewRevision` lido no
// preview (64 caracteres) e a chave de idempotência.

export interface CoverageFileCommandBody {
  organization_id: string;
  expectedRevision: string;
  idempotencyKey: string;
}

const REVISION = /^[0-9a-f]{64}$/i;

export function isPreviewRevision(value: unknown): value is string {
  return typeof value === "string" && REVISION.test(value);
}

/**
 * Lê os campos comuns; null quando faltam ou têm formato inválido. Devolve só
 * os campos do contrato — a geo-api recusa qualquer outro (422).
 */
export function readCoverageFileCommand(
  body: Record<string, unknown> | null,
): CoverageFileCommandBody | null {
  if (
    !body ||
    typeof body.organization_id !== "string" ||
    !isUuid(body.organization_id) ||
    !isPreviewRevision(body.expectedRevision) ||
    typeof body.idempotencyKey !== "string" ||
    !isUuid(body.idempotencyKey)
  ) {
    return null;
  }
  return {
    organization_id: body.organization_id,
    expectedRevision: body.expectedRevision,
    idempotencyKey: body.idempotencyKey,
  };
}
