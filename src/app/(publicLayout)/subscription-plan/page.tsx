import { ArrowRight, Clock3, CreditCard, Sparkles } from "lucide-react";
import Link from "next/link";

const statusCards = [
  {
    title: "Current status",
    description: "Subscription plans are currently unavailable.",
    icon: Clock3,
  },
  {
    title: "Next update",
    description:
      "Please check back later for plan availability and rollout updates.",
    icon: Sparkles,
  },
  {
    title: "Available now",
    description:
      "You can still purchase individual ideas from the public idea library.",
    icon: CreditCard,
  },
];

export default function Page() {
  return (
    <main className="public-page-shell">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_45%,#f0fdf4_100%)] p-7 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.38)] sm:p-9">
        <div className="pointer-events-none absolute -left-16 top-0 size-64 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.16),rgba(56,189,248,0)_72%)]" />
        <div className="pointer-events-none absolute -right-16 bottom-0 size-64 rounded-full bg-[radial-gradient(circle,rgba(74,222,128,0.14),rgba(74,222,128,0)_72%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.8),rgba(74,222,128,0.75),transparent)]" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_20rem]">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              <Sparkles className="size-3.5" />
              Subscription Plan
            </span>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Subscription plans are currently unavailable.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Please check back later. If you need access right now, go to the
                public idea library and continue with individual idea purchases
                instead.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/idea"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                Go-to ideas for individual purchases
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <aside className="rounded-[1.7rem] border border-emerald-200/70 bg-white/85 p-5 shadow-[0_22px_55px_-38px_rgba(6,95,70,0.28)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Access note
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Individual idea purchases are still active
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use the idea library to review available ideas and purchase access
              where needed while subscription plans remain offline.
            </p>
          </aside>
        </div>
      </section>

      {/* <section className="grid gap-4 md:grid-cols-3">
        {statusCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[1.7rem] border border-slate-200 bg-white/95 p-5 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.26)]"
          >
            <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
              <card.icon className="size-5" />
            </div>
            <p className="mt-4 text-lg font-semibold text-slate-950">
              {card.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {card.description}
            </p>
          </article>
        ))}
      </section> */}
    </main>
  );
}
