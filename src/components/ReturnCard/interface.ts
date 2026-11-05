import type { ReturnRequest } from "@/types/returns";

export interface ReturnCardProps {
  item: ReturnRequest;
  locale: string;
  /** Base do prazo do seller ("7h restantes"). */
  now: number;
}
