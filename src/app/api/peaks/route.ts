import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// shape of each row
type Peak = {
  peak: string;
  elevation_ft: number;
  lat: number;
  lon: number;
};

// load and parse csv
function loadPeaks(): Peak[] {
  const filePath = path.join(process.cwd(), "src", "data", "nh48.csv");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  return records.map((row: any) => ({
    peak: row.peak,
    elevation_ft: Number(row.elevation_ft),
    lat: Number(row.lat) || 0,
    lon: Number(row.lon) || 0,
  }));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  const peaks = loadPeaks();

  if (name) {
    const found = peaks.find(
      (p) => p.peak.toLowerCase() === name.toLowerCase()
    );
    if (!found) {
      return NextResponse.json(
        { error: `Peak not found: ${name}` },
        { status: 404 }
      );
    }
    return NextResponse.json(found);
  }

  return NextResponse.json(peaks);
}
