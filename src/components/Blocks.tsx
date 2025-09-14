"use client";

import { Block } from "@/types/blocks";

export default function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        if (b.type === "forecast_card") {
          return (
            <div key={i}>
              <h3 className="font-semibold">{b.title}</h3>
              <p>First hour: {b.data.temperatureF[0]}°F, wind {b.data.windMph[0]} mph</p>
            </div>
          );
        }
        if (b.type === "risk_badge") {
          return (
            <div key={i}>
              <h3 className="font-semibold">{b.title}</h3>
              <p>Level: {b.level}</p>
              <ul className="list-disc ml-4">
                {b.reasons.map((r: string, idx: number) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          );
        }
        if (b.type === "daylight_card") {
          return (
            <div key={i}>
              <h3 className="font-semibold">{b.title}</h3>
              <p>Start: {b.data.start}</p>
              <p>Turnaround: {b.data.turnaround}</p>
              <p>Finish deadline: {b.data.finishDeadline}</p>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
