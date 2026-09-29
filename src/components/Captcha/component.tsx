"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Box, Text } from "@chakra-ui/react";
import React from "react";

import { CaptchaProps } from "./interface";

const SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

/**
 * Indica se o hCaptcha está configurado neste ambiente. Exportado para que o
 * formulário não trave o submit em ambientes sem a site key (dev/CI): sem chave
 * não há como obter um token, e o upstream é a autoridade final de qualquer forma.
 */
export const HAS_CAPTCHA_SITE_KEY = Boolean(SITE_KEY);

/**
 * Desafio hCaptcha exibido no login a partir da 3ª tentativa falha, quando o
 * upstream passa a exigir `h-captcha-response`.
 *
 * O token é de uso único e expira: `onExpire`/`onError` devolvem `undefined`
 * para que o formulário volte a bloquear o envio até um novo desafio ser resolvido.
 */
export function Captcha({ onVerify, unavailableLabel }: CaptchaProps) {
  const ref = React.useRef<HCaptcha>(null);

  if (!SITE_KEY) {
    return unavailableLabel ? (
      <Text fontSize="12px" color="#A0ABB8">
        {unavailableLabel}
      </Text>
    ) : null;
  }

  return (
    <Box>
      <HCaptcha
        ref={ref}
        sitekey={SITE_KEY}
        onVerify={(token) => onVerify(token)}
        onExpire={() => onVerify(undefined)}
        onError={() => onVerify(undefined)}
      />
    </Box>
  );
}
