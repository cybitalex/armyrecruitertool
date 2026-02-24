// Army Rank Structure: Enlisted, Warrant Officers, Officers
export const ARMY_RANKS = [
  // Enlisted (E-5 through E-9)
  { value: "E-5", label: "E-5 — Sergeant (SGT)" },
  { value: "E-6", label: "E-6 — Staff Sergeant (SSG)" },
  { value: "E-7", label: "E-7 — Sergeant First Class (SFC)" },
  { value: "E-8", label: "E-8 — Master Sergeant (MSG)" },
  { value: "E-8-1SG", label: "E-8 — First Sergeant (1SG)" },
  { value: "E-9", label: "E-9 — Sergeant Major (SGM)" },
  { value: "E-9-CSM", label: "E-9 — Command Sergeant Major (CSM)" },
  // Warrant Officers (W-1 through W-5)
  { value: "W-1", label: "W-1 — Warrant Officer 1 (WO1)" },
  { value: "W-2", label: "W-2 — Chief Warrant Officer 2 (CW2)" },
  { value: "W-3", label: "W-3 — Chief Warrant Officer 3 (CW3)" },
  { value: "W-4", label: "W-4 — Chief Warrant Officer 4 (CW4)" },
  { value: "W-5", label: "W-5 — Chief Warrant Officer 5 (CW5)" },
  // Commissioned Officers (O-1 through O-10)
  { value: "O-1", label: "O-1 — Second Lieutenant (2LT)" },
  { value: "O-2", label: "O-2 — First Lieutenant (1LT)" },
  { value: "O-3", label: "O-3 — Captain (CPT)" },
  { value: "O-4", label: "O-4 — Major (MAJ)" },
  { value: "O-5", label: "O-5 — Lieutenant Colonel (LTC)" },
  { value: "O-6", label: "O-6 — Colonel (COL)" },
  { value: "O-7", label: "O-7 — Brigadier General (BG)" },
  { value: "O-8", label: "O-8 — Major General (MG)" },
  { value: "O-9", label: "O-9 — Lieutenant General (LTG)" },
  { value: "O-10", label: "O-10 — General (GEN)" },
  { value: "O-11", label: "O-11 — General of the Army (GA)" },
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

