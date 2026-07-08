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
