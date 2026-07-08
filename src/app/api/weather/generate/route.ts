import { NextResponse } from "next/server";
import { buildPrompt, fetchWeather } from "@/lib/weather";
import { allProviders, type ProviderResponse } from "@/lib/image-providers";

// Always dynamic: reads request body + process.env secrets.
export const dynamic = "force-dynamic";

interface GenerateBody {
  city: string;
  lat?: number;
  lon?: number;
}

export async function POST(request: Request) {
  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { city, lat, lon } = body;
  if (!city || typeof city !== "string") {
    return NextResponse.json({ error: "city is required" }, { status: 400 });
  }

  // Re-fetch weather server-side for authority (falls back to city-only if it fails).
  let weather;
  if (typeof lat === "number" && typeof lon === "number") {
    try {
      weather = await fetchWeather(lat, lon);
    } catch {
      weather = undefined;
    }
  }
  const prompt = buildPrompt(city, weather);

  // Call every configured provider in parallel; one failure does not block the rest.
  const settled = await Promise.allSettled(
    allProviders.map((provider) => provider.generate(prompt)),
  );

  const results: Record<string, ProviderResponse> = {};
  allProviders.forEach((provider, i) => {
    const outcome = settled[i];
    results[provider.name] =
      outcome.status === "fulfilled"
        ? outcome.value
        : { error: `provider threw: ${String(outcome.reason)}` };
  });

  return NextResponse.json({ prompt, weather, results });
}
