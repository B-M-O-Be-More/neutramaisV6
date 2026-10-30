import type { QuoteCategory } from "@/types/proposals";

export interface RfqCategoryPickerProps {
  value: QuoteCategory | null;
  onChange: (category: QuoteCategory) => void;
}
