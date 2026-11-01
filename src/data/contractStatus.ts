import type { IconType } from "react-icons";
import { LuCircleAlert, LuCircleCheckBig, LuRotateCcw } from "react-icons/lu";

import type { ContractStatus } from "@/types/contracts";

export interface ContractStatusStyle {
  bg: string;
  color: string;
  icon: IconType;
  /** Borda do card na lista. */
  cardBorder: string;
}

/** Selo de status e borda do card do contrato (Figma 2084-11736). */
export const CONTRACT_STATUS_STYLES: Record<
  ContractStatus,
  ContractStatusStyle
> = {
  active: {
    bg: "#EDFBF5",
    color: "#10B981",
    icon: LuCircleCheckBig,
    cardBorder: "#E5E8EE",
  },
  renewing: {
    bg: "#FFFBEB",
    color: "#D97706",
    icon: LuRotateCcw,
    cardBorder: "#FDE68A",
  },
  suspended: {
    bg: "#FEF2F2",
    color: "#EF4444",
    icon: LuCircleAlert,
    cardBorder: "#C52222",
  },
};
