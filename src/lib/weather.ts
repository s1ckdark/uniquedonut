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

const PROMPT_TEMPLATE = `Present a clear, 45° top-down view of a vertical (9:16) isometric miniature 3D cartoon scene, highlighting iconic landmarks centered in the composition to showcase precise and delicate modeling.

The scene features soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadow effects. Weather elements are creatively integrated into the urban architecture, establishing a dynamic interaction between the city's landscape and atmospheric conditions, creating an immersive weather ambiance.

Use a clean, unified composition with minimalistic aesthetics and a soft, solid-colored background that highlights the main content. The overall visual style is fresh and soothing.

Display a prominent weather icon at the top-center, with the date (x-small text) and temperature range (medium text) beneath it. The city name (large text) is positioned directly above the weather icon. The weather information has no background and can subtly overlap with the buildings.

The text should match the input city's native language.
Please retrieve current weather conditions for the specified city before rendering.

City name: {city}`;

/** Build the full image prompt. When weather is supplied, an explicit
 *  description is appended — image models can't reliably search the web, so
 *  we inject concrete conditions. */
export function buildPrompt(city: string, weather?: WeatherData): string {
  let prompt = PROMPT_TEMPLATE.replace("{city}", city);
  if (weather) {
    const desc = describeWeather(weather.wmoCode);
    prompt += `\n\nCurrent weather to render: ${desc} (${weather.tempMinC}–${weather.tempMaxC}°C)`;
  }
  return prompt;
}

/** BigDataCloud reverse geocode (client-side, no API key). Returns the
 *  city/locality name in the requested language. `lang` defaults to "local"
 *  (device locale) for native-language city names. */
export interface GeoResult {
  city: string;
  countryName: string;
}

export async function fetchReverseGeocode(
  lat: number,
  lon: number,
  lang: string = "local",
): Promise<GeoResult> {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${encodeURIComponent(lang)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`reverse geocode failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    city?: string;
    locality?: string;
    principalSubdivision?: string;
    countryName?: string;
  };
  const city = data.city || data.locality || data.principalSubdivision || "Unknown";
  return { city, countryName: data.countryName ?? "" };
}

/** Open-Meteo current + daily forecast (no API key). Returns today's min/max
 *  temperature (°C) and the current WMO weather code. */
export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=weather_code&daily=temperature_2m_max,temperature_2m_min` +
    `&timezone=auto&forecast_days=1`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`weather fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    current?: { weather_code: number };
    daily?: {
      temperature_2m_max: number[];
      temperature_2m_min: number[];
    };
  };
  const wmoCode = data.current?.weather_code ?? 0;
  const tempMaxC = data.daily?.temperature_2m_max?.[0] ?? 0;
  const tempMinC = data.daily?.temperature_2m_min?.[0] ?? 0;
  return { wmoCode, tempMaxC, tempMinC };
}
