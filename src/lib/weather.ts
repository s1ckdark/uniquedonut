// Weather data + prompt assembly for the Weather Atelier.
// The describe/build functions are pure and unit-tested; the fetch wrappers
// hit the network and are exercised manually.

export interface WeatherData {
  tempMinC: number;
  tempMaxC: number;
  wmoCode: number;
}

// WMO weather interpretation codes (subset). See Open-Meteo docs.
// https://open-meteo.com/en/docs  →  "WMO Weather interpretation codes (WW)"
const WMO: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "fog",
  48: "depositing rime fog",
  51: "light drizzle",
  53: "moderate drizzle",
  55: "dense drizzle",
  61: "slight rain",
  63: "moderate rain",
  65: "heavy rain",
  71: "slight snow fall",
  73: "moderate snow fall",
  75: "heavy snow fall",
  77: "snow grains",
  80: "slight rain showers",
  81: "moderate rain showers",
  82: "violent rain showers",
  85: "slight snow showers",
  86: "heavy snow showers",
  95: "thunderstorm",
  96: "thunderstorm with slight hail",
  99: "thunderstorm with heavy hail",
};

/** Convert a WMO weather code into a natural-language description. */
export function describeWeather(wmoCode: number): string {
  return WMO[wmoCode] ?? "unknown conditions";
}
