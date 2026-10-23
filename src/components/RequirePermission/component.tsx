"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { useSession } from "@/contexts/SessionContext";

import { RequirePermissionProps } from "./interface";

export const FORBIDDEN_ROUTE = "/403";

/**
 * Barreira de perfil dentro da área autenticada (SDD §11.2, camada 3): só
 * monta os filhos se o usuário da sessão tiver o perfil pedido; senão, leva
 * para `/403`. Os filhos não chegam a montar, então nenhuma chamada da página
 * protegida sai.
 *
 * Usar dentro do AuthenticatedLayout, que só renderiza o conteúdo depois de o
 * `GET /me` confirmar a sessão. É uma barreira de navegação: quem autoriza de
 * fato é a API.
 */
export function RequirePermission({ role, children }: RequirePermissionProps) {
  const router = useRouter();
  const { personas } = useSession();
  const allowed = personas.includes(role);

  React.useEffect(() => {
    if (!allowed) router.replace(FORBIDDEN_ROUTE);
  }, [allowed, router]);

  if (!allowed) return null;
  return <>{children}</>;
}
