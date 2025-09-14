import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const date = searchParams.get("date");

  if (!lat || !lon || !date) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${date}&formatted=0`;
  const res = await fetch(url);
  const data = await res.json();

  return NextResponse.json({
    sunrise: data.results.sunrise,
    sunset: data.results.sunset,
  });
}
