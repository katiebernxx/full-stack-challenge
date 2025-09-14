import { NextResponse } from "next/server";

// json shape
type ForecastPayload = {
  time: string[];            // ISO timestamps
  temperatureF: number[];    // °F
  apparentTempF: number[];   // °F
  windMph: number[];         // mph
  gustMph: number[];         // mph
  precipProb: number[];      // %
};

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get("lat");
    const lonStr = searchParams.get("lon");
    const elevFtStr = searchParams.get("elevation"); // feet

    if (!latStr || !lonStr) {
      return err("Missing lat or lon");
    }

    const lat = Number(latStr);
    const lon = Number(lonStr);

    if (Number.isNaN(lat) || lat < -90 || lat > 90)  return err("lat must be a number in [-90, 90]");
    if (Number.isNaN(lon) || lon < -180 || lon > 180) return err("lon must be a number in [-180, 180]");

    // parse elevation to be a number
    const elevFt = elevFtStr == null || elevFtStr === "" ? undefined : Number(elevFtStr);

    // make sure elevFt is a reasonable NH mountain elevation (realistically, < 7000, but allow up to 10000 for buffer)
    if (typeof elevFt === "number" && (Number.isNaN(elevFt) || elevFt < 0 || elevFt > 10000)) {
        return err("elevation (ft) out of range");
    }

    // convert feet → meters for open-meteo
    const elevM =
      elevFtStr != null && elevFtStr !== ""
        ? Math.round(Number(elevFtStr) * 0.3048)
        : undefined;

    // build the open-meteo url
    const qs = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      hourly:
        "temperature_2m,apparent_temperature,wind_speed_10m,wind_gusts_10m,precipitation_probability",
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      timezone: "auto",
    });

    if (typeof elevM === "number" && !Number.isNaN(elevM)) {
      qs.set("elevation", String(elevM));
    }

    const url = `https://api.open-meteo.com/v1/forecast?${qs.toString()}`;

    // fetch 
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) {
      return err("Upstream weather service error", 502);
    }
    const data = await res.json();

    // shaping
    const h = (data && data.hourly) || {};
    const payload: ForecastPayload = {
      time: h.time ?? [],
      temperatureF: h.temperature_2m ?? [],
      apparentTempF: h.apparent_temperature ?? [],
      windMph: h.wind_speed_10m ?? [],
      gustMph: h.wind_gusts_10m ?? [],
      precipProb: h.precipitation_probability ?? [],
    };

    return NextResponse.json(payload);
  } catch (e) {
    return err("Unexpected server error", 500);
  }
}
