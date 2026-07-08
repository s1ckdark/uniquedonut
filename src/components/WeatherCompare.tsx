"use client";

import { useState } from "react";
import type { ProviderResponse } from "@/lib/image-providers";

interface WeatherCompareProps {
  results: Record<string, ProviderResponse> | null;
  prompt: string | null;
}

function Panel({ name, response }: { name: string; response?: ProviderResponse }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="font-bold text-[#6BCB77]">{name}</span>
        {response && "latencyMs" in response && (
          <span className="text-xs text-white/50">{response.latencyMs}ms</span>
        )}
      </div>
      <div className="p-2">
        {!response ? (
          <div className="flex aspect-[9/16] max-h-96 items-center justify-center text-white/30">
            대기 중
          </div>
        ) : "error" in response ? (
          <div className="flex aspect-[9/16] max-h-96 items-center justify-center p-4 text-center text-sm text-[#FF6B9D]">
            {response.error}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={response.image}
            alt={`${name} result`}
            className="mx-auto max-h-96 rounded"
          />
        )}
      </div>
    </div>
  );
}

export default function WeatherCompare({ results, prompt }: WeatherCompareProps) {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <section className="mt-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Panel name="Gemini" response={results?.Gemini} />
        <Panel name="OpenAI" response={results?.OpenAI} />
      </div>

      {prompt && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowPrompt((s) => !s)}
            className="text-xs text-white/50 underline transition hover:text-white/70 cursor-pointer"
          >
            {showPrompt ? "프롬프트 숨기기" : "사용된 프롬프트 보기"}
          </button>
          {showPrompt && (
            <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/60">
              {prompt}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}
