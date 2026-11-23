import { HeartHandshake, MessageCircle, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import { CountUp, Reveal } from "@/components/motion/Reveal";

const STATS = [
  { to: 12, suffix: "", label: "Traditional products" },
  { to: 5, suffix: "", label: "Pack sizes, 100 g – 1 kg" },
  { to: 5, prefix: "3–", label: "Days to your door" },
  { to: 2, suffix: "", label: "Trusted couriers: DTDC & India Post" },
];

const TRUST = [
  { icon: Truck, title: "Pan-India delivery", body: "Shipped nationwide, 3–5 days by location." },
  { icon: ShieldCheck, title: "Secure payments", body: "UPI, cards & netbanking via Razorpay." },
  { icon: RefreshCcw, title: "Damaged? Replaced.", body: "Report within 48 hours for a free replacement or refund." },
  { icon: HeartHandshake, title: "Made with care", body: "Traditional recipes, carefully selected ingredients." },
  { icon: MessageCircle, title: "Real people", body: "Talk to us on WhatsApp or phone." },
];

export function TrustStats() {
  return (
    <section aria-label="Why families trust Ritan" className="relative bg-cream-50 py-24 lg:py-32">
      <div className="container-x">
        <dl className="grid grid-cols-2 gap-y-12 border-y border-forest-900/10 py-12 lg:grid-cols-4 lg:py-16">
          {STATS.map((s) => (
            <div key={s.label} className="px-2 text-center lg:border-r lg:border-forest-900/10 lg:last:border-r-0">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="block font-display text-[clamp(3.2rem,6vw,5.5rem)] leading-none text-forest-800">
                  <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} />
                </span>
                <span className="mt-3 block text-sm text-ink-500">{s.label}</span>
              </dd>
            </div>
          ))}
        </dl>
        <Reveal className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-5" stagger={0.08}>
          {TRUST.map((t) => (
            <div key={t.title} data-reveal-item className="flex gap-4 lg:flex-col">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sprout-100 text-forest-700">
                <t.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold text-forest-900">{t.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">{t.body}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
