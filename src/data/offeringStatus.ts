import type { OfferingStatus } from "@/services/productCatalog.service";

/** Borda do card e selo de cada status da oferta (Figma 2462-29276). */
export const OFFERING_STATUS_STYLES: Record<
  OfferingStatus,
  { border: string; bg: string; dot: string; color: string }
> = {
  published: {
    border: "#AAECD5",
    bg: "#EDFBF5",
    dot: "#10B981",
    color: "#10B981",
  },
  paused: {
    border: "#FDE68A",
    bg: "#FFFBEB",
    dot: "#F59E0B",
    color: "#D97706",
  },
  draft: { border: "#E5E8EE", bg: "#F4F6F9", dot: "#C4CDD8", color: "#8A9AB5" },
  unpublished: {
    border: "#FECACA",
    bg: "#FEF2F2",
    dot: "#EF4444",
    color: "#EF4444",
  },
  archived: {
    border: "#E5E8EE",
    bg: "#F4F6F9",
    dot: "#C4CDD8",
    color: "#8A9AB5",
  },
};
