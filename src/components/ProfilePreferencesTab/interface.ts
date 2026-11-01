import type { SidebarPersona } from "@/components/AppSidebar/interface";
import type { ProfilePreferences } from "@/services/profile.service";

export interface ProfilePreferencesTabProps {
  /** Papéis da sessão: a venda automática só aparece para o seller. */
  personas: SidebarPersona[];
  /** Salva notificações, venda e moeda; devolve a chave do erro, ou null. */
  onSave: (preferences: ProfilePreferences) => Promise<string | null>;
}
