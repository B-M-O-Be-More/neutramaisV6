"use client";

import { useTranslation } from "react-i18next";
import { LuInfo } from "react-icons/lu";

import CollapsibleNotice from "@/components/CollapsibleNotice";

import { ProposalsHowItWorksProps } from "./interface";

/**
 * Faixa "Propostas e RFQ · Como funcionam" no topo da página (Figma
 * 2073-38659): diferença entre proposta direta e RFQ. Recolhe e fecha.
 */
export function ProposalsHowItWorks({ onDismiss }: ProposalsHowItWorksProps) {
  const { t } = useTranslation();

  return (
    <CollapsibleNotice
      tone="blue"
      icon={LuInfo}
      title={t("Proposals.howItWorks.title")}
      description={t("Proposals.howItWorks.description")}
      labels={{
        collapse: t("Proposals.howItWorks.collapse"),
        expand: t("Proposals.howItWorks.expand"),
        dismiss: t("Proposals.howItWorks.dismiss"),
      }}
      onDismiss={onDismiss}
    />
  );
}
