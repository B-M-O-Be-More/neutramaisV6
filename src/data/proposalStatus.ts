import type { IconType } from "react-icons";
import {
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuMessageSquare,
  LuPencil,
} from "react-icons/lu";

import type { DirectProposalStatus, RfqStatus } from "@/types/proposals";

export interface ProposalStatusStyle {
  bg: string;
  color: string;
  icon: IconType;
}

/** Selo de status da proposta direta (Figma 2485-29130). */
export const DIRECT_PROPOSAL_STATUS_STYLES: Record<
  DirectProposalStatus,
  ProposalStatusStyle
> = {
  awaiting: { bg: "#FFFBEB", color: "#D97706", icon: LuClock },
  revisionRequested: { bg: "#EEF3FF", color: "#1F5AFF", icon: LuPencil },
  accepted: { bg: "#EDFBF5", color: "#10B981", icon: LuCircleCheck },
  rejected: { bg: "#FEF2F2", color: "#EF4444", icon: LuCircleX },
  cancelled: { bg: "#F4F6F9", color: "#8A9AB5", icon: LuCircleX },
};

/** Selo de status da RFQ (Figma 2038-19649). */
export const RFQ_STATUS_STYLES: Record<RfqStatus, ProposalStatusStyle> = {
  proposalReceived: {
    bg: "#EEF3FF",
    color: "#1F5AFF",
    icon: LuMessageSquare,
  },
  awaiting: { bg: "#FFFBEB", color: "#D97706", icon: LuClock },
  converted: { bg: "#EDFBF5", color: "#10B981", icon: LuCircleCheck },
  expired: { bg: "#FEF2F2", color: "#EF4444", icon: LuCircleX },
  cancelled: { bg: "#F4F6F9", color: "#8A9AB5", icon: LuCircleX },
};
