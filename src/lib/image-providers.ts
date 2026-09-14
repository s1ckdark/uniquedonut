// Image-generation provider wrappers. Server-only (reads process.env secrets).
// Each provider returns a result OR an error object — never throws — so the
// Route Handler can render one provider's failure alongside the other's success.

export interface ImageResult {
  image: string; // base64 data URL, e.g. "data:image/png;base64,..."
  latencyMs: number;
}

export interface ProviderError {
  error: string;
}

export type ProviderResponse = ImageResult | ProviderError;

export interface ImageProvider {
  name: string;
  /** True when the required API key env var is set. */
  configured: boolean;
  generate(prompt: string): Promise<ProviderResponse>;
}

export function isError(x: ProviderResponse): x is ProviderError {
  return "error" in x;
}

const REQUEST_TIMEOUT_MS = 45_000;
const RETRY_DELAYS_MS = [1_000, 2_000];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** POST JSON with a per-attempt timeout and retry on 429/5xx (transient
 *  quota/rate-limit and server errors). Rethrows on the last attempt —
 *  callers wrap in try/catch and return ProviderError. */
async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (
        (res.status === 429 || res.status >= 500) &&
        attempt < RETRY_DELAYS_MS.length
      ) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      return res;
    } catch (err) {
      // Network error or timeout.
      if (attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw err;
    }
  }
}

// --- Gemini (Nano Banana 2) via the Interactions API ---
const GEMINI_MODEL = "gemini-3.1-flash-image";

export const geminiProvider: ImageProvider = {
  name: "Gemini",
  get configured() {
    return Boolean(process.env.GEMINI_API_KEY);
  },
  async generate(prompt: string): Promise<ProviderResponse> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return { error: "GEMINI_API_KEY not configured" };
    const start = Date.now();
    try {
      const res = await postJson(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        {
          model: GEMINI_MODEL,
          input: prompt,
          response_format: {
            type: "image",
            aspect_ratio: "9:16",
            image_size: "1K",
          },
        },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return {
          error: `Gemini API error ${res.status}: ${text.slice(0, 200)}`,
        };
      }
      const data = (await res.json()) as { output_image?: { data?: string } };
      const b64 = data.output_image?.data;
      if (!b64) return { error: "Gemini returned no image data" };
      return {
        image: `data:image/png;base64,${b64}`,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return { error: `Gemini request failed: ${(err as Error).message}` };
    }
  },
};

// --- OpenAI gpt-image-1 via the images API ---
const OPENAI_MODEL = "gpt-image-1";

export const openaiProvider: ImageProvider = {
  name: "OpenAI",
  get configured() {
    return Boolean(process.env.OPENAI_API_KEY);
  },
  async generate(prompt: string): Promise<ProviderResponse> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return { error: "OPENAI_API_KEY not configured" };
    const start = Date.now();
    try {
      const res = await postJson(
        "https://api.openai.com/v1/images/generations",
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        {
          model: OPENAI_MODEL,
          prompt,
          size: "1024x1536", // gpt-image-1's portrait size (1024x1792 was DALL·E 3)
          n: 1,
        },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return {
          error: `OpenAI API error ${res.status}: ${text.slice(0, 200)}`,
        };
      }
      const data = (await res.json()) as { data?: { b64_json?: string }[] };
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) return { error: "OpenAI returned no image data" };
      return {
        image: `data:image/png;base64,${b64}`,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return { error: `OpenAI request failed: ${(err as Error).message}` };
    }
  },
};

export const allProviders: ImageProvider[] = [geminiProvider, openaiProvider];
