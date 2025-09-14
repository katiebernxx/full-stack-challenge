import { ForecastCardBlock } from "@/types/blocks";

export default function ForecastCard({
  summitTempF,
  summitWindGustMph,
  precipProbPct,
  note,
}: ForecastCardBlock) {
  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <div><span className="font-medium">Temp:</span> {summitTempF ?? "—"}°F</div>
      <div><span className="font-medium">Gusts:</span> {summitWindGustMph ?? "—"} mph</div>
      <div><span className="font-medium">Precip:</span> {precipProbPct ?? "—"}%</div>
      {note ? <div className="col-span-3 text-xs text-ink/80">{note}</div> : null}
    </div>
  );
}
