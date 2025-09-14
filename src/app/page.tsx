"use client";

import { useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";

import FlipCard from "@/components/FlipCard";
import DaylightCard from "@/components/DaylightCard";
import RiskBadge from "@/components/RiskBadge";
import ForecastCard from "@/components/ForecastCard";

import type {
  Block,
  DaylightCardBlock,
  RiskBadgeBlock,
  ForecastCardBlock,
  BlocksPayload,
} from "@/types/blocks";

function extractLatestBlocks(messages: any[]): Block[] | null {
  // look from newest to oldest messages to find most recent render_blocks tool result
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const parts = (m && m.parts) || [];
    for (let j = parts.length - 1; j >= 0; j--) {
      const p = parts[j];
      if (p?.type === "tool-result" && p?.toolName === "render_blocks") {
        // Tool can return either blocks or just [...]
        const result = p.result;
        const blocks = Array.isArray(result) ? result : result?.blocks;
        return Array.isArray(blocks) ? (blocks as Block[]) : null;
      }
    }
  }
  return null;
}

export default function HomePage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({ api: "/api/chat" });

  // right side card state
  const [daylight, setDaylight] = useState<DaylightCardBlock | null>(null);
  const [risk, setRisk] = useState<RiskBadgeBlock | null>(null);
  const [forecast, setForecast] = useState<ForecastCardBlock | null>(null);

  // whenever new messages come
  useEffect(() => {
 
    const blocks = extractLatestBlocks(messages);
    if (!blocks?.length) return;

    let dl: DaylightCardBlock | null = null;
    let rk: RiskBadgeBlock | null = null;
    let fc: ForecastCardBlock | null = null;

    for (const b of blocks) {
      switch (b.type) {
        case "daylight_card":
          dl = b as DaylightCardBlock;
          break;
        case "risk_badge":
          rk = b as RiskBadgeBlock;
          break;
        case "forecast_card":
          fc = b as ForecastCardBlock;
          break;
      }
    }

    console.log("Extracted blocks:", { dl, rk, fc });

    // only update state if we have valid blocks
    if (dl && dl.sunriseISO && dl.sunsetISO && dl.startISO && dl.turnaroundISO) {
      setDaylight(dl);
      console.log("Daylight updated:", dl);
    }
    if (rk && rk.level && Array.isArray(rk.reasons)) {
      setRisk(rk);
      console.log("Risk updated:", rk);
    }
    if (fc && (fc.summitTempF !== undefined || fc.summitWindGustMph !== undefined || fc.precipProbPct !== undefined)) {
      setForecast(fc);
      console.log("Forecast updated:", fc);
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
        {/* Chat side */}
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-display">Plan Your Adventure</h2>

          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className="whitespace-pre-wrap">
                <div className="mb-1 text-xs opacity-70">
                  {m.role === "user" ? "User" : "Guide48"}
                </div>

                {/* Render only text, ignore tool messages  */}
                {(m as any).parts
                  ?.filter((p: any) => p.type === "text")
                  .map((p: any, i: number) => <div key={i}>{p.text}</div>)}
              </div>
            ))}

            {isLoading && (
              <div className="text-sm opacity-70">Thinking…</div>
            )}
            {error && <div className="text-sm text-red-700">{error.message}</div>}

            <form onSubmit={handleSubmit}>
              <input
                className="w-full rounded-lg border border-black/10 bg-white/70 p-3"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about a hike…"
              />
            </form>
          </div>
        </section>

        {/* Right side: flip cards */}
        <aside className="space-y-6">
          <FlipCard
            title="Forecast"
            flipped={!!forecast}
            frontHint="Ask for a plan to see forecast."
          >
            {forecast ? <ForecastCard {...forecast} /> : null}
          </FlipCard>

          <FlipCard
            title="Risk"
            flipped={!!risk}
            frontHint="Risk appears after we plan your day."
          >
            {risk ? <RiskBadge {...risk} /> : null}
          </FlipCard>

          <FlipCard
            title="Daylight"
            flipped={!!daylight}
            frontHint="We'll compute start & turnaround."
          >
            {daylight ? <DaylightCard {...daylight} /> : null}
          </FlipCard>
        </aside>
      </div>

     
    </div>
  );
}