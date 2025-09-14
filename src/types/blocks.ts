export type ForecastCardBlock = {
  type: "forecast_card";
  summitTempF?: number | null;
  summitWindGustMph?: number | null;
  precipProbPct?: number | null;
  note?: string;
};

export type RiskBadgeBlock = {
  type: "risk_badge";
  level: "low" | "moderate" | "high";
  reasons: string[];
};

export type DaylightCardBlock = {
  type: "daylight_card";
  sunriseISO: string;
  sunsetISO: string;
  startISO: string;
  turnaroundISO: string;
  finishDeadlineISO?: string;
};

export type Block = ForecastCardBlock | RiskBadgeBlock | DaylightCardBlock;

export type BlocksPayload = {
  blocks: Block[];
};