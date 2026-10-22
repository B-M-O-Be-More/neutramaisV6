"use client";

import React from "react";

import { readInviteToken } from "@/functions/inviteToken";

export const INVITE_ACCEPT_PATH = "/platform-invites/accept";

/**
 * O link do convite de operador aponta para a home
 * (`FRONTEND_URL#token=<token>/change-password`). Quando a home abre com um
 * token no fragmento, leva para a tela de aceite, onde o convidado define a
 * senha. O token segue no fragmento: ele nunca vai para o servidor nem para
 * os logs.
 *
 * Usa `location.replace` para a home com o token não ficar no histórico.
 */
export function InviteLinkRedirect() {
  React.useEffect(() => {
    const token = readInviteToken(window.location.hash);
    if (token) window.location.replace(`${INVITE_ACCEPT_PATH}#token=${token}`);
  }, []);

  return null;
}
