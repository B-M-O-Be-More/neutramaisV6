export const PROFILE_TABS = [
  "personal",
  "company",
  "access",
  "security",
  "preferences",
  "support",
] as const;

export type ProfileTab = (typeof PROFILE_TABS)[number];

export interface ProfileTabsProps {
  value: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}
