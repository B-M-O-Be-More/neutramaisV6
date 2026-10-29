import { NextRequest } from "next/server";

import { envelopeError, forwardToIdentity } from "@/server/identityProxy";

// Status aceitos pelo upstream: um por consulta (sem "todos").
const STATUSES = [
  "pending",
  "active",
  "suspended",
  "anonymized",
  "taken_down",
] as const;

// BFF: GET /api/admin/organizations → identity-api GET /admin/organizations
// Organizações por status (padrão `pending`), paginadas: `limit` de 1 a 200
// (padrão 50) e `offset`. Rota autenticada: exige `org:suspend`, a permissão
// de gestão de organizações do admin da Neutra+. Sem busca nem filtro de tipo.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");

  if (status && !(STATUSES as readonly string[]).includes(status)) {
    return envelopeError(422, "validation_error", "status inválido.");
  }
  if (limit && !/^\d+$/.test(limit)) {
    return envelopeError(422, "validation_error", "limit deve ser um número.");
  }
  if (offset && !/^\d+$/.test(offset)) {
    return envelopeError(422, "validation_error", "offset deve ser um número.");
  }

  // Só os parâmetros do contrato seguem para o upstream.
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (limit) query.set("limit", limit);
  if (offset) query.set("offset", offset);
  const qs = query.toString();

  return forwardToIdentity({
    method: "GET",
    path: `/admin/organizations${qs ? `?${qs}` : ""}`,
  });
}
