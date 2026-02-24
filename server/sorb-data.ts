/**
 * SORB (Special Operations Recruiting Battalion) static station metadata.
 * No Excel dependency: TEST DATA.xlsx is import-only and not used at runtime.
 */

export interface SORBRegistrationStation {
  stationCode: string;
  name: string;
  base: string;
  company: string;
}

// Canonical SORB bases (matches current SORB registration UX)
const SORB_BASES = [
  "FT BENNING",
  "FT BLISS",
  "FT BRAGG",
  "FT CAMPBELL",
  "FT CARSON",
  "FT DRUM",
  "FT HOOD",
  "FT POLK",
  "FT RILEY",
  "FT RUCKER",
  "FT STEWART",
  "JBER",
  "JBLM",
  "MDW",
  "GERMANY",
  "HAWAII",
  "ITALY",
  "KOREA",
  "EGLIN AFB DESTIN",
  "CP FRANK MERRILL",
];

const SORB_COMPANIES = ["A Co", "B Co", "C Co", "D Co"];

function makeStationCode(base: string, company: string): string {
  const b = base.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const c = company.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return `SORB-${b}-${c}`.slice(0, 64);
}

export function getSORBRegistrationStations(): SORBRegistrationStation[] {
  const stations: SORBRegistrationStation[] = [];
  for (const base of SORB_BASES) {
    for (const company of SORB_COMPANIES) {
      stations.push({
        stationCode: makeStationCode(base, company),
        name: `${base} - ${company}`,
        base,
        company,
      });
    }
  }
  return stations.sort((a, b) =>
    a.base === b.base ? a.company.localeCompare(b.company) : a.base.localeCompare(b.base)
  );
}

