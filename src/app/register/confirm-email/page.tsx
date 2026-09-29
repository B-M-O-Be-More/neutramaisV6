import { redirect } from "next/navigation";

// A landing de confirmação passou a viver em `/confirm-email` (raiz), que é o
// caminho que o backend coloca no link do e-mail. Esta rota fica como redirect
// para não quebrar links já enviados, preservando token e user_id da query.
export default async function LegacyConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
    else if (Array.isArray(value) && value[0]) query.set(key, value[0]);
  }

  const qs = query.toString();
  redirect(`/confirm-email${qs ? `?${qs}` : ""}`);
}
