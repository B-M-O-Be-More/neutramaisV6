import type { KycQueueItem } from "@/services/admin.service";

export interface AdminOrganizationCardProps {
  request: KycQueueItem;
  expanded: boolean;
  onToggle: () => void;
}
