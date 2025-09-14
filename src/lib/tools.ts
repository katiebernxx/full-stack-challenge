import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { getDefaultDurationHours } from "./plan";

export type Peak = {
  peak: string;
  elevation_ft: number;
  lat: number;
  lon: number;
};

// Load NH48.csv
const peaksPath = path.join(process.cwd(), "src/data/nh48.csv");
const peaks = parse(fs.readFileSync(peaksPath), {
  columns: true,
  skip_empty_lines: true,
});

// normalize peak names to avoid name not founds 

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^mt\.?\s+/, "mount ")
    .replace(/^mount\s+/, "")
    .trim();
}

// common nicknames in the whites
const GROUP_ALIASES: Record<string, string[]> = {
  "the bonds": ["Bondcliff", "Bond", "West Bond"],
  "bonds": ["Bondcliff", "Bond", "West Bond"],
  "franconia ridge": [
    "Lafayette",
    "Lincoln",
    "Liberty",
    "Flume",
  ],
  "presidential range": [
    "Washington",
    "Adams",
    "Jefferson",
    "Madison",
    "Monroe",
    "Eisenhower",
    "Pierce"]

};

function getSinglePeak(name: string): Peak {
  const match = peaks.find(
    (p: any) => normalizeName(p.peak) === normalizeName(name)
  );
  if (!match) {
    throw new Error(`Peak not found: ${name}`);
  }
  return {
    peak: match.peak,
    elevation_ft: Number(match.elevation),
    lat: Number(match.lat),
    lon: Number(match.lon),
  };
}

function withCombinedDuration(peaks: Peak[]) {
  const base = peaks.reduce(
    (max, p) => Math.max(max, getDefaultDurationHours(p.peak)),
    0
  );
  const combinedDurationHours = base + (peaks.length - 1); // +1h per extra peak
  return { peaks, combinedDurationHours };
}

// main lookup fn
export async function getPeakByName(name: string) {
  const target = normalizeName(name);

  if (GROUP_ALIASES[target]) {
    const expanded = GROUP_ALIASES[target].map((n) => getSinglePeak(n));
    return withCombinedDuration(expanded);
  }

  // multi-peak split on "and" or commas
  const parts = target.split(/\s*(?:,|and)\s*/).filter(Boolean);
  if (parts.length > 1) {
    const expanded = parts.map((p) => getSinglePeak(p));
    return withCombinedDuration(expanded);
  }

  // single peak
  const single = getSinglePeak(target);
  return withCombinedDuration([single]);
}

export async function getDaylight(lat: number, lon: number, date: string) {
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/api/sun?lat=${lat}&lon=${lon}&date=${date}`
  );
  if (!res.ok) throw new Error("Daylight API failed");
  return res.json();
}

export async function getForecast(
  lat: number,
  lon: number,
  elevation: number
) {
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/api/forecast?lat=${lat}&lon=${lon}&elevation=${elevation}`
  );
  if (!res.ok) throw new Error("Forecast API failed");
  return res.json();
}
