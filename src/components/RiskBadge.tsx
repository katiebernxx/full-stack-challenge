import { RiskBadgeBlock } from "@/types/blocks";

const color = (level: RiskBadgeBlock["level"]) =>
  level === "high" ? "bg-red-600" : level === "moderate" ? "bg-amber-600" : "bg-emerald-700";

export default function RiskBadge({ level, reasons }: RiskBadgeBlock) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm">
        <div className={`h-2.5 w-2.5 rounded-full ${color(level)}`} />
        <div className="font-medium">Risk: {level}</div>
      </div>
      {reasons?.length ? (
        <ul className="mt-2 list-disc pl-5 text-xs text-ink/80">
          {reasons.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      ) : null}
    </div>
  );
}
