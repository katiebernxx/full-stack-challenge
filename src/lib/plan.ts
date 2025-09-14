export type PlanResult = {
  /** start time (est) */
  start: string;
  /** turnaround time (est) */
  turnaround: string;
  /** deadline (est) = sunset - 90 min */
  finishDeadline: string;
};

/**
 * Format date.
 */
function formatLocal(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Compute a conservative day plan from daylight + a hike duration.
 *
 * Rules:
 *  - Earliest start = sunrise + 30 min
 *  - Finish deadline = sunset - 90 min
 *  - Start = max(earliestStart, finishDeadline - hike duration)
 *  - Turnaround = start + 0.6 * hike duration (60% of hike)
 *  - Turnaround cannot exceed the finish deadline
 */
export function computePlan({
  sunriseISO,
  sunsetISO,
  durationHours,
}: {
  sunriseISO: string;
  sunsetISO: string;
  /** total expected time */
  durationHours: number;
}): PlanResult {
  const sunrise = new Date(sunriseISO).getTime();
  const sunset = new Date(sunsetISO).getTime();

  if (Number.isNaN(sunrise) || Number.isNaN(sunset)) {
    throw new Error("Invalid sunrise/sunset timestamps");
  }

  const earliestStart = sunrise + 30 * 60 * 1000; // +30 min
  const finishDeadline = sunset - 90 * 60 * 1000; // -90 min

  const D = durationHours * 60 * 60 * 1000;
  const latestStartToStillFinish = finishDeadline - D;

  // choose the later
  const start = Math.max(earliestStart, latestStartToStillFinish);

  // summit/turnaround ~60% of the day
  const turnaround = start + D * 0.6;

  const turnaroundClamped = Math.min(turnaround, finishDeadline);

  return {
    start: formatLocal(new Date(start)),
    turnaround: formatLocal(new Date(turnaroundClamped)),
    finishDeadline: formatLocal(new Date(finishDeadline)),
  };
}

/**
 * longer peaks. anything not listed defaults to 6h
 */
const DEFAULT_DURATION_BY_PEAK: Record<string, number> = {
  "Mount Washington": 8,
  "Mount Lafayette": 7,
  "Mount Lincoln": 7,
  "Mount Adams": 7.5,
  "Mount Jefferson": 7,
  "South Twin": 7,
  "Bondcliff": 8,
  "Mount Bond": 8,
  "West Bond": 7,
};

export function getDefaultDurationHours(peakName: string): number {
  return DEFAULT_DURATION_BY_PEAK[peakName] ?? 6;
}
