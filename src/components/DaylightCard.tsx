import { DaylightCardBlock } from "@/types/blocks";

function formatLocalEST(value: string) {
  const d = new Date(value);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  // already a human string from computePlan? just return it
  return value;
}

export default function DaylightCard({
  sunriseISO,
  sunsetISO,
  startISO,
  turnaroundISO,
  finishDeadlineISO,
}: DaylightCardBlock) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div><span className="font-medium">Sunrise:</span> {formatLocalEST(sunriseISO)}</div>
      <div><span className="font-medium">Sunset:</span> {formatLocalEST(sunsetISO)}</div>
      <div><span className="font-medium">Start:</span> {formatLocalEST(startISO)}</div>
      <div><span className="font-medium">Turnaround:</span> {formatLocalEST(turnaroundISO)}</div>
      {finishDeadlineISO && (
        <div className="col-span-2">
          <span className="font-medium">Be done by:</span> {formatLocalEST(finishDeadlineISO)}
        </div>
      )}
    </div>
  );
}
