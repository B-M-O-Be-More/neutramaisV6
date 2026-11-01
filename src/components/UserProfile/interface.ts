import type { ProfileTab } from "@/components/ProfileTabs";

export interface UserProfileProps {
  /** Aba aberta ao entrar (`?tab=`). */
  initialTab: ProfileTab;
  /** Troca de aba; a página espelha na URL. */
  onTabChange?: (tab: ProfileTab) => void;
}
