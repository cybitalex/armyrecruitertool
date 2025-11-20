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

