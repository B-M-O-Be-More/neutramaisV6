import type { IconType } from "react-icons";
import {
  LuCircleAlert,
  LuCircleCheckBig,
  LuCircleX,
  LuClock,
  LuPenLine,
} from "react-icons/lu";

import type { ContractStatus } from "@/types/contracts";

export interface ContractStatusStyle {
  bg: string;
  color: string;
  icon: IconType;
  /** Borda do card na lista. */
  cardBorder: string;
}

const AWAITING: ContractStatusStyle = {
  bg: "#FFFBEB",
  color: "#D97706",
  icon: LuPenLine,
  cardBorder: "#FDE68A",
};

const PROCESSING: ContractStatusStyle = {
  bg: "#EEF3FF",
  color: "#1F5AFF",
  icon: LuClock,
  cardBorder: "#E5E8EE",
};

/** Selo de status e borda do card do contrato. */
export const CONTRACT_STATUS_STYLES: Record<
  ContractStatus,
  ContractStatusStyle
> = {
  awaiting_signer: AWAITING,
  awaiting_signatures: AWAITING,
  provider_pending: PROCESSING,
  provider_uncertain: PROCESSING,
  provider_failed: {
    bg: "#FEF2F2",
    color: "#EF4444",
    icon: LuCircleAlert,
    cardBorder: "#FECACA",
  },
  signed: {
    bg: "#EDFBF5",
    color: "#10B981",
    icon: LuCircleCheckBig,
    cardBorder: "#E5E8EE",
  },
  cancelled: {
    bg: "#F4F6F9",
    color: "#8A9AB5",
    icon: LuCircleX,
    cardBorder: "#E5E8EE",
  },
};
