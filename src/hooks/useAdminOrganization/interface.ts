import type {
  AdminOrganizationDetail,
  OrganizationMember,
} from "@/services/admin.service";

export type AdminOrganizationError = "notFound" | "forbidden" | "failed";

export interface UseAdminOrganizationReturn {
  organization: AdminOrganizationDetail | null;
  isLoading: boolean;
  error: AdminOrganizationError | null;
  reload: () => void;
}

export interface UseOrganizationMembersReturn {
  members: OrganizationMember[];
  total: number;
  isLoading: boolean;
  error: AdminOrganizationError | null;
  reload: () => void;
}
