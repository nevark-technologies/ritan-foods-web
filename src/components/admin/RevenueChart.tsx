"use client";

import { useRef, useState } from "react";
import { formatINR } from "@/lib/utils";

export interface DayPoint {
  date: string; // ISO yyyy-mm-dd
  label: string; // "22"
  long: string; // "Sat, 22 Nov"
  revenue: number; // paise
  orders: number;
}

const BAR = "#4e8f2f"; // validated against #fbf7ee (lightness, chroma, contrast)
const BAR_HOVER = "#6aa845";

/** Daily revenue columns: one series, per-bar hover/focus tooltip, table view. */
export function RevenueChart({ data }: { data: DayPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const W = 640;
  const H = 220;
  const pad = { top: 18, right: 8, bottom: 26, left: 52 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const niceMax = Math.ceil(max / 100 / 500) * 500 * 100 || 50000; // round up to ₹500
  const slot = innerW / data.length;
  const barW = Math.min(24, slot - 6);
  const y = (v: number) => pad.top + innerH - (v / niceMax) * innerH;
  const ticks = [0, 0.5, 1].map((t) => Math.round(niceMax * t));
  const last = data.length - 1;

  return (
    <div>
      <div ref={wrap} className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Revenue for the last ${data.length} days. Total ${formatINR(data.reduce((s, d) => s + d.revenue, 0))}.`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="#16201a" strokeOpacity={t === 0 ? 0.35 : 0.08} strokeWidth={1} />
              <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-500 text-[10px]">
                {t === 0 ? "₹0" : `₹${(t / 100 / 1000).toFixed(t / 100 >= 10000 ? 0 : 1)}k`}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = pad.left + i * slot + (slot - barW) / 2;
            const top = y(d.revenue);
            const h = Math.max(0, pad.top + innerH - top);
            const r = Math.min(4, h);
            const path = h > 0 ? `M${x},${pad.top + innerH} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${pad.top + innerH} Z` : "";
            const showLabel = i === last || i % 2 === last % 2;
            return (
              <g key={d.date}>
                {path && <path d={path} fill={active === i ? BAR_HOVER : BAR} />}
                {showLabel && (
                  <text x={x + barW / 2} y={H - 8} textAnchor="middle" className="fill-ink-500 text-[10px]">
                    {d.label}
                  </text>
                )}
                {i === last && d.revenue > 0 && (
                  <text x={x + barW / 2} y={top - 6} textAnchor="middle" className="fill-ink-900 text-[10px] font-semibold">
                    {formatINR(d.revenue)}
                  </text>
                )}
                {/* hit target: the full column slot, larger than the bar */}
                <rect
                  x={pad.left + i * slot}
                  y={pad.top}
                  width={slot}
                  height={innerH + 4}
                  fill="transparent"
                  tabIndex={0}
                  role="img"
                  aria-label={`${d.long}: ${formatINR(d.revenue)} from ${d.orders} ${d.orders === 1 ? "order" : "orders"}`}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="cursor-default outline-none"
                />
              </g>
            );
          })}
        </svg>
        {active !== null && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-xl bg-forest-950 px-3 py-2 text-xs text-cream-50 shadow-lg"
            style={{ left: `${((pad.left + active * slot + slot / 2) / W) * 100}%`, top: `${(Math.max(pad.top, y(data[active].revenue)) / H) * 100}%`, marginTop: -8 }}
            role="status"
          >
            <span className="tabular block text-sm font-bold">{formatINR(data[active].revenue)}</span>
            <span className="block text-cream-50/70">
              {data[active].long} · {data[active].orders} {data[active].orders === 1 ? "order" : "orders"}
            </span>
          </div>
        )}
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs font-semibold text-forest-800">View as table</summary>
        <table className="mt-3 w-full text-left text-xs">
          <thead>
            <tr className="text-ink-500">
              <th className="py-1 font-semibold">Date</th>
              <th className="py-1 font-semibold">Orders</th>
              <th className="py-1 text-right font-semibold">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date} className="border-t border-forest-900/5">
                <td className="py-1">{d.long}</td>
                <td className="tabular py-1">{d.orders}</td>
                <td className="tabular py-1 text-right">{formatINR(d.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
