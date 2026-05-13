import type { Metadata } from "next";
import Link from "next/link";
import Sprinkles from "@/components/Sprinkles";
import {
  defaultEbsDocumentaryQuery,
  type EbsDocumentary,
  searchEbsDocumentaries,
  suggestedEbsQueries,
} from "@/lib/ebs-youtube";

export const metadata: Metadata = {
  title: "EBS Documentary Shelf — UNIQUE DONUT",
  description: "Search-based YouTube shelf for EBS documentaries with description-based summaries.",
};

export const dynamic = "force-dynamic";

type DocumentaryPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

const accentColors = ["#FF6B9D", "#FFD93D", "#6BCB77", "#FF8C42"];

export default async function EbsDocumentariesPage({ searchParams }: DocumentaryPageProps) {
  const params = await searchParams;
  const rawQuery = firstQueryParam(params.q) ?? defaultEbsDocumentaryQuery;
  const result = await searchEbsDocumentaries(rawQuery);

  return (
    <>
      <Sprinkles />
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <section className="pt-12 pb-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
            <Link
              href="/"
              className="w-fit flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all hover:scale-105"
              style={{
                background: "#FF6B9D20",
                color: "#FF6B9D",
                border: "1px solid #FF6B9D50",
              }}
            >
              ← Home
            </Link>
            <div
              className="w-fit px-4 py-2 rounded-full border border-dashed text-sm font-bold uppercase tracking-[0.25em]"
              style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D", borderColor: "#FFD93D" }}
            >
              Search-based collection
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <p
                className="mb-4 text-sm font-black uppercase tracking-[0.35em]"
                style={{ color: "#6BCB77", fontFamily: "var(--font-space-grotesk)" }}
              >
                YouTube / EBS / Documentary
              </p>
              <h1
                className="text-5xl md:text-7xl font-black leading-none"
                style={{
                  fontFamily: "'Bungee Shade', cursive",
                  color: "#FF6B9D",
                  textShadow:
                    "0 0 20px rgba(255,107,157,0.5), 0 0 40px rgba(255,107,157,0.25), 3px 3px 0px #FFD93D",
                }}
              >
                EBS DOCU
                <br />
                SHELF
              </h1>
              <p
                className="mt-5 max-w-2xl text-lg leading-8 text-white/75"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                YouTube Data API 검색 결과를 모아 EBS 다큐멘터리 후보를 보여줍니다. 요약은 영상 설명과
                메타데이터를 바탕으로 만든 짧은 소개이며, 자막이나 본문 전체 요약은 아닙니다.
              </p>
            </div>

            <SearchPanel query={result.query} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3 mb-10">
          <MetricCard label="Current query" value={result.query} color="#FF6B9D" />
          <MetricCard
            label="Videos found"
            value={result.status === "success" ? String(result.items.length) : "0"}
            color="#FFD93D"
          />
          <MetricCard label="Quota note" value="100 units/search" color="#6BCB77" />
        </section>

        {result.status === "missing-key" && <MissingKeyPanel />}
        {result.status === "error" && <ErrorPanel message={result.message} />}
        {result.status === "success" && <DocumentaryGrid documentaries={result.items} />}
      </main>
    </>
  );
}

function SearchPanel({ query }: { query: string }) {
  return (
    <div
      className="rounded-[2rem] p-5 sm:p-6"
      style={{
        background: "linear-gradient(135deg, rgba(255,107,157,0.18), rgba(107,203,119,0.12))",
        border: "1px solid rgba(255,255,255,0.16)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
      }}
    >
      <form action="/ebs-documentaries" className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="ebs-documentary-query">
          EBS documentary search query
        </label>
        <input
          id="ebs-documentary-query"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="EBS 다큐프라임, 명의, 세계테마기행..."
          className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/10 px-5 py-4 text-base text-white outline-none placeholder:text-white/40 focus:border-[#FFD93D]"
        />
        <button
          type="submit"
          className="rounded-full px-6 py-4 text-base font-black uppercase tracking-wider transition-transform hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #FFD93D, #FF8C42)",
            color: "#1A0A2E",
            fontFamily: "'Fredoka', cursive",
          }}
        >
          Search
        </button>
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        {suggestedEbsQueries.map((suggested) => (
          <Link
            key={suggested}
            href={`/ebs-documentaries?q=${encodeURIComponent(suggested)}`}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white/75 transition-all hover:-translate-y-0.5 hover:text-white"
          >
            {suggested}
          </Link>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-3xl p-5"
      style={{ background: `${color}18`, border: `1px solid ${color}55` }}
    >
      <p className="text-xs font-black uppercase tracking-[0.25em] text-white/45">{label}</p>
      <p
        className="mt-2 text-2xl font-black"
        style={{ color, fontFamily: "'Fredoka', cursive", textShadow: `0 0 14px ${color}55` }}
      >
        {value}
      </p>
    </div>
  );
}

function MissingKeyPanel() {
  return (
    <StatePanel color="#FFD93D" title="YouTube API key가 필요합니다">
      <p>
        검색 결과를 불러오려면 프로젝트 루트의 <code className="text-[#FFD93D]">.env.local</code>에
        <code className="mx-1 text-[#FFD93D]">YOUTUBE_API_KEY</code>를 설정하세요. 키는 서버에서만 읽고
        브라우저 번들에는 포함하지 않습니다.
      </p>
    </StatePanel>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <StatePanel color="#FF6B9D" title="검색을 완료하지 못했습니다">
      <p>{message}</p>
    </StatePanel>
  );
}

function StatePanel({
  children,
  color,
  title,
}: {
  children: React.ReactNode;
  color: string;
  title: string;
}) {
  return (
    <section
      className="rounded-[2rem] p-8 text-white/75"
      style={{ background: `${color}14`, border: `1px solid ${color}66` }}
    >
      <h2 className="mb-3 text-2xl font-black text-white" style={{ fontFamily: "'Fredoka', cursive" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function DocumentaryGrid({ documentaries }: { documentaries: EbsDocumentary[] }) {
  if (documentaries.length === 0) {
    return (
      <StatePanel color="#6BCB77" title="검색 결과가 없습니다">
        <p>다른 EBS 다큐멘터리 검색어를 입력해 보세요.</p>
      </StatePanel>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {documentaries.map((documentary, index) => (
        <DocumentaryCard
          key={documentary.videoId}
          documentary={documentary}
          color={accentColors[index % accentColors.length]}
        />
      ))}
    </section>
  );
}

function DocumentaryCard({ documentary, color }: { documentary: EbsDocumentary; color: string }) {
  return (
    <article
      className="group overflow-hidden rounded-[1.75rem] transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "rgba(26,10,46,0.88)",
        border: `2px solid ${color}`,
        boxShadow: `0 12px 40px rgba(0,0,0,0.35), 0 0 20px ${color}24`,
      }}
    >
      <a href={documentary.watchUrl} target="_blank" rel="noreferrer" className="block">
        <div
          aria-label={`${documentary.title} thumbnail`}
          className="relative aspect-video overflow-hidden bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${documentary.thumbnailUrl})` }}
        >
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <span
              className="inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider"
              style={{ background: color, color: "#1A0A2E", fontFamily: "'Fredoka', cursive" }}
            >
              Watch on YouTube
            </span>
          </div>
        </div>
      </a>

      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold text-white/45">
          <span>{documentary.channelTitle}</span>
          <span style={{ color }}>•</span>
          <time dateTime={documentary.publishedAt}>{formatDate(documentary.publishedAt)}</time>
        </div>
        <h2 className="text-xl font-black leading-tight text-white" style={{ fontFamily: "'Fredoka', cursive" }}>
          {documentary.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/65">{documentary.summary}</p>
      </div>
    </article>
  );
}

function firstQueryParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function formatDate(value: string): string {
  if (!value) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
