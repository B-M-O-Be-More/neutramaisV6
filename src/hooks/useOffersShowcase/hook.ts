"use client";

import React from "react";

import { placeholderOffersShowcase } from "@/data/offersPlaceholder";

import type { UseOffersShowcaseReturn } from "./interface";

/**
 * Campanhas da vitrine de ofertas. A marketplace-api ainda não expõe
 * campanhas, reputação de provedor nem prazos de promoção: a vitrine nasce
 * dos dados do design, no formato que a API terá.
 */
export function useOffersShowcase(): UseOffersShowcaseReturn {
  const [now] = React.useState(() => Date.now());
  const showcase = React.useMemo(() => placeholderOffersShowcase(now), [now]);
  return { showcase, now };
}
