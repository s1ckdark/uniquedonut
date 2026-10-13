"use client";

import Link from "next/link";
import {
  EXCESS_BY_BRACKET,
  HERO,
  LOW_TIER_RECEIVED_TIERS,
  LOW_TIER_TOTAL,
  MIN_EXCESS_TOTAL,
  OVER_100M_BY_BRACKET,
  PREMIUM_RATE_BALANCED,
  PREMIUM_RATE_NOW,
  TIMELINE,
  excessRates,
  heroMultiple,
  maxBracketPopulation,
} from "@/lib/pension";
import { CountUp, GrowBar, Reveal } from "@/components/ScrollFX";

const fmtInt = (n: number) => Math.round(n).toLocaleString("ko-KR");

const won = (n: number) => `${Math.round(n / 10000).toLocaleString("ko-KR")}만원`;

export default function PensionPage() {
  const maxPop = maxBracketPopulation();
  const rates = excessRates();
  const maxOver = Math.max(...OVER_100M_BY_BRACKET.map((r) => r.count));
  const maxTier = Math.max(...LOW_TIER_RECEIVED_TIERS.map((t) => t.count));

  return (
    <div className="min-h-screen bg-[#1A0A2E] text-[#FEFEFE]">
      <main className="mx-auto max-w-3xl px-4 py-10">
        {/* header */}
        <div className="mb-10 flex items-center justify-between">
          <Link
            href="/shop"
            className="rounded-full bg-[#4D96FF]/15 px-4 py-2 text-sm font-bold text-[#4D96FF] transition hover:scale-105"
          >
            ← Shop
          </Link>
          <span className="font-mono text-xs text-white/40">
            출처: 국민연금공단 · 최보윤 의원실 (뉴시스 2026-10-13)
          </span>
        </div>

        <header className="mb-14 text-center">
          <p className="text-5xl">💰</p>
          <h1
            className="mt-4 text-4xl font-black leading-tight md:text-5xl"
            style={{
              fontFamily: "'Bungee Shade', cursive",
              color: "#4D96FF",
              textShadow: "0 0 20px rgba(77,150,255,0.5), 3px 3px 0px #FFD93D",
            }}
          >
            PENSION
          </h1>
          <p
            className="mt-3 text-lg font-bold"
            style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
          >
            1천만원 내고 1억원 넘게 받은 사람들
          </p>
        </header>

        {/* ---------- hero: 833만 → 1억1190만 ---------- */}
        <Reveal>
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-center text-sm font-bold tracking-widest text-white/50">
              납부 1000만원 이하 · 수급 1억원 초과
            </p>
            <p className="mt-2 text-center text-6xl font-black text-[#4D96FF]">
              <CountUp to={HERO.beneficiaries} format={fmtInt} />
              <span className="ml-2 text-2xl text-white/60">명</span>
            </p>
            <p className="mt-1 text-center text-sm text-white/50">
              2만명에 육박하는 수령자가 발생한 이유는 제도 초창기 가입
            </p>

            <div className="mt-10 space-y-6">
              <div>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-bold text-white/80">평균 납부 보험료</span>
                  <span className="font-mono text-white/60">{won(HERO.paidAvg)}</span>
                </div>
                <GrowBar
                  pct={(HERO.paidAvg / HERO.receivedAvg) * 100}
                  color="#FF6B9D"
                  heightClass="h-5"
                />
              </div>
              <div>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-bold text-white/80">
                    평균 수급액 ({HERO.months}개월)
                  </span>
                  <span className="font-mono text-[#4D96FF]">{won(HERO.receivedAvg)}</span>
                </div>
                <GrowBar
                  pct={100}
                  color="#4D96FF"
                  heightClass="h-10"
                  delay={200}
                />
              </div>
              <p className="text-center text-2xl font-black text-[#FFD93D]">
                무려{" "}
                <CountUp
                  to={heroMultiple()}
                  format={(n) => n.toFixed(1)}
                  className="text-4xl"
                />
                배!
              </p>
            </div>
          </section>
        </Reveal>

        {/* ---------- 낸 것보다 많이 받은 사람들 ---------- */}
        <Reveal>
          <section className="mt-16">
            <h2
              className="text-2xl font-black"
              style={{ fontFamily: "'Fredoka', cursive", color: "#FF6B9D" }}
            >
              낸 것보다 많이 받은 사람들
            </h2>
            <p className="mt-1 text-sm text-white/50">
              최소{" "}
              <b className="text-white">
                <CountUp to={MIN_EXCESS_TOTAL} format={fmtInt} />
              </b>{" "}
              명이 낸 보험료보다 많은 연금을 수령 — 납부액 구간별 현황
            </p>
            <div className="mt-6 space-y-7">
              {rates.map((row, i) => (
                <GrowBar
                  key={row.label}
                  pct={(row.total / maxPop) * 100}
                  color="#FF6B9D"
                  heightClass="h-7"
                  delay={i * 100}
                  label={row.label}
                  valueLabel={`${fmtInt(row.excess)} / ${fmtInt(row.total)}명 (${(row.rate * 100).toFixed(0)}%)`}
                />
              ))}
            </div>
            <p className="mt-4 text-xs text-white/40">
              막대 = 구간 총 인원, 표기 = (낸 것보다 많이 받은 인원 / 구간 인원)
            </p>
          </section>
        </Reveal>

        {/* ---------- 1000만원 이하 납부자의 수급액 분포 ---------- */}
        <Reveal>
          <section className="mt-16">
            <h2
              className="text-2xl font-black"
              style={{ fontFamily: "'Fredoka', cursive", color: "#6BCB77" }}
            >
              1천만원만 낸 사람들은 얼마나 받았나
            </h2>
            <p className="mt-1 text-sm text-white/50">
              납부 1000만원 이하 {fmtInt(LOW_TIER_TOTAL)}명의 수급액 분포
            </p>
            <div className="mt-6 space-y-6">
              {LOW_TIER_RECEIVED_TIERS.map((t, i) => (
                <GrowBar
                  key={t.label}
                  pct={(t.count / maxTier) * 100}
                  color="#6BCB77"
                  heightClass="h-6"
                  delay={i * 100}
                  label={t.label}
                  valueLabel={`${fmtInt(t.count)}명`}
                />
              ))}
            </div>
          </section>
        </Reveal>

        {/* ---------- 연금 1억원 이상 수령자 ---------- */}
        <Reveal>
          <section className="mt-16">
            <h2
              className="text-2xl font-black"
              style={{ fontFamily: "'Fredoka', cursive", color: "#FFD93D" }}
            >
              연금 1억원 이상 받은 사람들은?
            </h2>
            <p className="mt-1 text-sm text-white/50">
              1억원+ 수령자를 납부 보험료 구간별로 나열한 분포
            </p>
            <div className="mt-6 space-y-5">
              {OVER_100M_BY_BRACKET.map((row, i) => (
                <GrowBar
                  key={row.label}
                  pct={(row.count / maxOver) * 100}
                  color="#FFD93D"
                  heightClass="h-5"
                  delay={i * 60}
                  label={row.label}
                  valueLabel={`${fmtInt(row.count)}명`}
                />
              ))}
            </div>
          </section>
        </Reveal>

        {/* ---------- 타임라인 ---------- */}
        <Reveal>
          <section className="mt-16">
            <h2
              className="text-2xl font-black"
              style={{ fontFamily: "'Fredoka', cursive", color: "#4D96FF" }}
            >
              어떻게 여기까지 왔나
            </h2>
            <div className="relative mt-8 space-y-10 pl-6">
              <div className="absolute top-0 bottom-0 left-[7px] w-0.5 rounded-full bg-white/10" />
              {TIMELINE.map((ev, i) => (
                <Reveal key={ev.year} delay={i * 120}>
                  <div className="relative">
                    <span className="absolute top-1 -left-[26px] flex h-4 w-4 items-center justify-center rounded-full bg-[#4D96FF] shadow-[0_0_12px_rgba(77,150,255,0.8)]" />
                    <p className="font-mono text-xl font-black text-[#4D96FF]">
                      {ev.year}
                    </p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {ev.emoji} {ev.title}
                    </p>
                    <p className="mt-0.5 text-sm text-white/50">{ev.detail}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ---------- 보험료율 게이지 ---------- */}
        <Reveal>
          <section className="mt-16 rounded-3xl border border-white/10 bg-white/5 p-8">
            <h2
              className="text-2xl font-black"
              style={{ fontFamily: "'Fredoka', cursive", color: "#FF6B9D" }}
            >
              남은 숙제 — 수지균형 보험료율
            </h2>
            <p className="mt-1 text-sm text-white/50">
              현행 소득대체율 43%를 지급하려면 보험료율이 21.2%까지 필요하다는
              분석 (연금개혁 정책토론회)
            </p>
            <div className="mt-8 space-y-6">
              <GrowBar
                pct={(PREMIUM_RATE_NOW / PREMIUM_RATE_BALANCED) * 100}
                color="#FF6B9D"
                heightClass="h-7"
                label="현행 보험료율"
                valueLabel={`${PREMIUM_RATE_NOW}%`}
              />
              <GrowBar
                pct={100}
                color="#FF6B9D"
                heightClass="h-12"
                delay={200}
                label="수지균형 보험료율"
                valueLabel={`${PREMIUM_RATE_BALANCED}%`}
              />
            </div>
            <p className="mt-6 text-center text-sm text-white/60">
              논의 중인 개혁: 수급 개시연령 상향 · 자동조정장치 · 사전 국고 투입 ·
              운용 수익률 제고
            </p>
          </section>
        </Reveal>

        <footer className="mt-16 pb-6 text-center text-xs text-white/30">
          데이터: 국회 보건복지위 최보윤 의원실 받은 국민연금공단 자료 ·
          뉴시스 보도(2026-10-13) 기반 인포그래픽
        </footer>
      </main>
    </div>
  );
}
