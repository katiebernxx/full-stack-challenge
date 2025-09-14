export type RiskLevel = "low" | "moderate" | "high";

export type RiskResult = {
  level: RiskLevel;
  reasons: string[];
  summary: {
    maxGustMph: number | null;
    minApparentF: number | null;
    maxPrecipProb: number | null;
  };
};

type Inputs = {
  apparentF: number[];   // Hourly apparent temperatures (degrees)
  gustMph: number[];     // Hourly wind gusts (mph)
  precipProb: number[];  // Hourly precipitation probabilities (0–100)
  exposed?: boolean;     // True if the peak/route is on an exposed ridge
};


export const EXPOSED_PEAKS = new Set<string>([
  // Presis
  "Mount Washington",
  "Mount Adams",
  "Mount Jefferson",
  "Mount Madison",
  "Mount Monroe",
  "Mount Eisenhower",
  "Mount Pierce", // conservative

  // Franconia Ridge
  "Mount Lafayette",
  "Mount Lincoln",

  // Bonds
  "Mount Bond",
  "West Bond",
  "Bondcliff",

  // Other 
  "Mount Moosilauke",
  "South Twin",
  "Mount Garfield",
  "Mount Liberty",
  "Mount Flume",
  "Cannon Mountain",
]);

export function isExposedPeak(name: string): boolean {
  return EXPOSED_PEAKS.has(name.trim());
}

/**
 * Compute overall hiking risk (low/moderate/high).
 * Rules:
 *  - Wind gusts ≥ 35 mph = 2 points (3 if exposed)
 *  - Apparent temp ≤ 10°F = 2 points
 *  - Precip probability ≥ 60% = 1 point
 *
 * 0-1 = low, 2 = moderate, 3+ = high
 */
export function computeRisk({
  apparentF,
  gustMph,
  precipProb,
  exposed = false,
}: Inputs): RiskResult {
  const reasons: string[] = [];

  const maxGust = gustMph.length ? Math.max(...gustMph) : null;
  const minApp = apparentF.length ? Math.min(...apparentF) : null;
  const maxPrecip = precipProb.length ? Math.max(...precipProb) : null;

  let score = 0;

  if (maxGust !== null && maxGust >= 35) {
    const windPts = exposed ? 3 : 2;
    score += windPts;
    reasons.push(`Wind gusts ≥ 35 mph${exposed ? " (exposed ridge)" : ""}`);
  }

  if (minApp !== null && minApp <= 10) {
    score += 2;
    reasons.push("Apparent temperature ≤ 10°F");
  }

  if (maxPrecip !== null && maxPrecip >= 60) {
    score += 1;
    reasons.push("Precipitation probability ≥ 60%");
  }

  let level: RiskLevel = "low";
  if (score >= 3) level = "high";
  else if (score === 2) level = "moderate";

  if (reasons.length === 0) reasons.push("No major weather risks detected.");

  return {
    level,
    reasons,
    summary: {
      maxGustMph: maxGust,
      minApparentF: minApp,
      maxPrecipProb: maxPrecip,
    },
  };
}

// slice n hours of forecast
export function sliceNextHours<T>(
  timesISO: string[],
  arrays: Record<string, T[]>,
  hours = 12
): Record<string, T[]> {
  if (!timesISO.length) return arrays;

  const now = Date.now();
  let idx = timesISO.findIndex((iso) => new Date(iso).getTime() >= now);
  if (idx < 0) idx = 0;

  const end = Math.min(idx + hours, timesISO.length);
  const out: Record<string, T[]> = {};
  for (const [k, arr] of Object.entries(arrays)) {
    out[k] = Array.isArray(arr) ? arr.slice(idx, end) : arr;
  }
  return out;
}
