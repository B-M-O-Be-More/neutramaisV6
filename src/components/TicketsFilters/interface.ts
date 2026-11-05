import type { TicketFilter } from "@/types/tickets";

export interface TicketsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: TicketFilter;
  onFilterChange: (value: TicketFilter) => void;
}
