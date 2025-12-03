// Army Enlisted Rank Structure
export const ARMY_RANKS = [
  { value: "E-5", label: "E-5 — Sergeant (SGT)" },
  { value: "E-6", label: "E-6 — Staff Sergeant (SSG)" },
  { value: "E-7", label: "E-7 — Sergeant First Class (SFC)" },
  { value: "E-8", label: "E-8 — Master Sergeant (MSG)" },
  { value: "E-8-1SG", label: "E-8 — First Sergeant (1SG)" },
  { value: "E-9", label: "E-9 — Sergeant Major (SGM)" },
  { value: "E-9-CSM", label: "E-9 — Command Sergeant Major (CSM)" },
] as const;

export type ArmyRank = typeof ARMY_RANKS[number]["value"];

// User Roles
export const USER_ROLES = {
  RECRUITER: 'recruiter',
  STATION_COMMANDER: 'station_commander',
  PENDING_STATION_COMMANDER: 'pending_station_commander',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Account types for registration
export const ACCOUNT_TYPES = [
  { value: "recruiter", label: "Recruiter", description: "Individual recruiter account" },
  { value: "station_commander", label: "Station Commander", description: "Oversee multiple recruiters (requires approval)" },
] as const;

