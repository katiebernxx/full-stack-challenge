import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

import { getPeakByName, getDaylight, getForecast } from "@/lib/tools";
import {
  computePlan,
  getDefaultDurationHours,
} from "@/lib/plan";
import {
  computeRisk,
  sliceNextHours,
  isExposedPeak,
} from "@/lib/risk";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `
You are Guide48, a safety-first expert on New Hampshire 4000-footers.
Voice: short sentences, friendly, like a seasoned AMC hut caretaker. You like telling hiking stories but don't ramble, are slightly humorous, and like to teach.
You are like a wise old man who knows the mountains well and wants people to have great experiences in the mountains.
When someone asks about hiking a peak, you will ask questions until you understand the date and peak name.

Protocol:
1. Call get_peak_by_name.
2. Normalize relative dates like "tomorrow" → YYYY-MM-DD.
3. Call get_daylight(lat, lon, date).
4. Call get_forecast(lat, lon, elevation_ft).
5. Call compute_plan(sunriseISO, sunsetISO, peakName).
6. Call compute_risk(peakName, hourly arrays).

Final step:
- You MUST return two things:
  a) A short plain-text summary (2–5 sentences).
  b) A call to the render_blocks tool with:
     - a daylight_card using the plan result,
     - a risk_badge using the risk result,
     - a forecast_card.
Never skip render_blocks. you MUST call render_blocks. Always include all three: one daylight_card, one risk_badge, and one forecast_card.
Never print the blocks or JSON in the chat. Do not include code fences.
Only the summary should be text. The blocks must be returned ONLY via the render_blocks tool.

`,
    messages,
    maxSteps: 10,
    tools: {
      get_peak_by_name: {
        description:
          "Look up lat, lon, elevation_ft for a named NH 4000-footer",
        parameters: z.object({ name: z.string() }),
        execute: async ({ name }) => getPeakByName(name),
      },
      get_daylight: {
        description:
          "Get sunrise/sunset for a lat, lon, date (YYYY-MM-DD)",
        parameters: z.object({
          lat: z.number(),
          lon: z.number(),
          date: z.string(),
        }),
        execute: async ({ lat, lon, date }) => getDaylight(lat, lon, date),
      },
      get_forecast: {
        description:
          "Get weather forecast for a lat, lon and elevation (ft). Should return hourly arrays (time, apparentF, gustMph, precipProb).",
        parameters: z.object({
          lat: z.number(),
          lon: z.number(),
          elevation: z.number(),
        }),
        execute: async ({ lat, lon, elevation }) =>
          getForecast(lat, lon, elevation),
      },

      compute_plan: {
        description:
          "Compute start/turnaround using sunrise/sunset and a default duration for the peak.",
        parameters: z.object({
          peakName: z.string(),
          sunriseISO: z.string(),
          sunsetISO: z.string(),
          // optional override if the user explicitly gave hours
          durationHours: z.number().optional(),
        }),
        execute: async ({ peakName, sunriseISO, sunsetISO, durationHours }) => {
          const D =
            typeof durationHours === "number"
              ? durationHours
              : getDefaultDurationHours(peakName);
          const plan = computePlan({ sunriseISO, sunsetISO, durationHours: D });
          return { ...plan, usedDurationHours: D };
        },
      },

    render_blocks: {
  description:
    "Render structured UI cards.",
  parameters: z.object({
    blocks: z.array(
      z
        .object({
          type: z.string(),
        })
        .catchall(z.any())
    ),
  }),
  execute: async ({ blocks }) => {
    // normalize times into est
    function normalizeDaylight(b: any) {
      const sunriseISO = b.sunriseISO ?? b.sunrise ?? b.sunRise ?? null;
      const sunsetISO = b.sunsetISO ?? b.sunset ?? b.sunSet ?? null;
      const startISO = b.startISO ?? b.start ?? null;
      const turnaroundISO = b.turnaroundISO ?? b.turnaround ?? b.turn ?? null;
      const finishDeadlineISO =
        b.finishDeadlineISO ?? b.finishDeadline ?? b.finish ?? null;

      return {
        type: "daylight_card",
        sunriseISO,
        sunsetISO,
        startISO,
        turnaroundISO,
        ...(finishDeadlineISO ? { finishDeadlineISO } : {}),
      };
    }

    function normalizeForecast(b: any) {
      let summitTempF = b.summitTempF ?? null;
      let summitWindGustMph = b.summitWindGustMph ?? null;
      let precipProbPct = b.precipProbPct ?? null;

      const rows: any[] = Array.isArray(b.forecast) ? b.forecast : [];

      if (rows.length) {
        const temps = rows
          .map((r) => Number(r.apparentF))
          .filter((n) => Number.isFinite(n));
        const gusts = rows
          .map((r) => Number(r.gustMph))
          .filter((n) => Number.isFinite(n));
        const precps = rows
          .map((r) => Number(r.precipProb))
          .filter((n) => Number.isFinite(n));

        if (temps.length) {
          // min feels like temp
          summitTempF = Math.min(...temps);
        }
        if (gusts.length) {
          summitWindGustMph = Math.max(...gusts);
        }
        if (precps.length) {
          precipProbPct = Math.max(...precps);
        }
      }

      // If rows were not provided but risk numbers were, reuse them
      if (summitTempF == null && Number.isFinite(b.minApparentF))
        summitTempF = b.minApparentF;
      if (summitWindGustMph == null && Number.isFinite(b.maxGustMph))
        summitWindGustMph = b.maxGustMph;
      if (precipProbPct == null && Number.isFinite(b.maxPrecipProb))
        precipProbPct = b.maxPrecipProb;

      return {
        type: "forecast_card",
        ...(summitTempF != null ? { summitTempF } : {}),
        ...(summitWindGustMph != null ? { summitWindGustMph } : {}),
        ...(precipProbPct != null ? { precipProbPct } : {}),
        ...(typeof b.note === "string" && b.note ? { note: b.note } : {}),
      };
    }

    function normalizeRisk(b: any) {
      // keep level + reasons, ignore extras
      const level =
        b.level === "high" || b.level === "moderate" ? b.level : "low";
      const reasons = Array.isArray(b.reasons) ? b.reasons : [];
      return { type: "risk_badge", level, reasons };
    }

    const normalized = (blocks as any[]).map((b) => {
      const t = String(b?.type || "").toLowerCase();
      if (t === "daylight_card") return normalizeDaylight(b);
      if (t === "risk_badge") return normalizeRisk(b);
      if (t === "forecast_card") return normalizeForecast(b);
      return null;
    }).filter(Boolean) as any[];

    console.log("render_blocks called with:", JSON.stringify(normalized, null, 2));
    return { blocks: normalized };
  },
},

      compute_risk: {
        description:
          "Compute risk (low/moderate/high) and reasons using the next 12 hours of forecast near summit.",
        parameters: z.object({
          peakName: z.string(),
          timesISO: z.array(z.string()),
          apparentF: z.array(z.number()),
          gustMph: z.array(z.number()),
          precipProb: z.array(z.number()),
          windowHours: z.number().optional(), // default 12
        }),
        execute: async ({
          peakName,
          timesISO,
          apparentF,
          gustMph,
          precipProb,
          windowHours,
        }) => {
          const exposed = isExposedPeak(peakName);
          const sliced = sliceNextHours<number>(
            timesISO,
            { apparentF, gustMph, precipProb },
            windowHours ?? 12
          );

          const risk = computeRisk({
            apparentF: sliced.apparentF,
            gustMph: sliced.gustMph,
            precipProb: sliced.precipProb,
            exposed,
          });
          return { ...risk, exposed };
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
