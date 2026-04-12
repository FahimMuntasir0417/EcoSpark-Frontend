import {
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Quote,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { HomeIdeasShowcase } from "./_components/home-ideas-showcase";

const featureCards = [
  {
    title: "Scientist-grade submission flow",
    description:
      "Capture context-rich proposals with category, impact, feasibility, and resource details in one guided workflow.",
    icon: FlaskConical,
  },
  {
    title: "Transparent moderation pipeline",
    description:
      "Review, approve, reject, archive, and feature ideas through a structured admin control center with full visibility.",
    icon: ShieldCheck,
  },
  {
    title: "Member discovery and adoption",
    description:
      "Enable members to discover ideas, compare impact, and move toward implementation through saves, votes, and purchases.",
    icon: UsersRound,
  },
];

const workflowSteps = [
  {
    label: "Submit",
    detail: "Scientists propose ideas with implementation and impact context.",
  },
  {
    label: "Moderate",
    detail:
      "Admins validate quality and route the strongest proposals forward.",
  },
  {
    label: "Prioritize",
    detail: "Teams compare measurable value across shortlisted opportunities.",
  },
  {
    label: "Adopt",
    detail: "Members engage, pilot, and scale approved sustainability ideas.",
  },
];

const inspirationPanels = [
  {
    eyebrow: "Urban Retrofit",
    title:
      "Solar rooftops that turn dense neighborhoods into active energy surfaces.",
    description:
      "A visual section fed by online-hosted imagery to make the landing page feel more editorial and contemporary.",
    stat: "City-scale renewable momentum",
    imageUrl:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80",
  },
  {
    eyebrow: "Circular Systems",
    title:
      "Facilities designed around reuse, efficiency, and cleaner operational loops.",
    description:
      "Use it as a visual break between workflow content and the live idea feed without changing backend data.",
    stat: "Operational resilience in view",
    imageUrl:
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80",
  },
  {
    eyebrow: "Landscape Recovery",
    title:
      "Nature-forward imagery that keeps the page anchored in long-term environmental outcomes.",
    description:
      "The section is decorative, but it still supports the platform story: credible ideas with real-world impact.",
    stat: "Environmental outcomes made visible",
    imageUrl:
      "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=1200&q=80",
  },
];

const testimonials = [
  {
    quote:
      "Our review cycle dropped from weeks to days because every idea came in structured and ready to evaluate.",
    name: "Amina Rahman",
    role: "Program Lead, GreenLab Network",
  },
  {
    quote:
      "The visibility from draft to featured helped us prioritize high-impact proposals without losing good experiments.",
    name: "Michael Reyes",
    role: "Innovation Manager, Urban Climate Hub",
  },
  {
    quote:
      "We now align scientists, administrators, and members around one decision framework.",
    name: "Nadia Karim",
    role: "Operations Director, Eco Futures Collective",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$0",
    subtitle: "For early pilots",
    label: "Entry plan",
    note: "Test the public idea library and submission workflow with minimal friction.",
    highlights: [
      "Public idea browsing",
      "Basic profile and submissions",
      "Community feedback access",
    ],
    ctaLabel: "Start free",
    ctaHref: "/subscription-plan",
  },
  {
    name: "Growth",
    price: "$29",
    subtitle: "Per member/month",
    label: "Most popular",
    note: "Built for active teams that need faster moderation, prioritization, and reporting.",
    highlights: [
      "Advanced moderation workspace",
      "Priority listing controls",
      "Role-specific analytics",
    ],
    ctaLabel: "Choose growth",
    ctaHref: "/subscription-plan",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    subtitle: "For large organizations",
    label: "Tailored rollout",
    note: "Designed for organizations that need onboarding, policy controls, and hands-on support.",
    highlights: [
      "Dedicated onboarding",
      "Policy and workflow customization",
      "Priority support and training",
    ],
    ctaLabel: "Contact sales",
    ctaHref: "/subscription-plan",
  },
];

export default function Home() {
  return (
    <main className="public-page-shell gap-12 py-12 lg:py-20">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-[linear-gradient(160deg,rgba(255,255,255,0.97),rgba(248,250,252,0.95))] p-8 shadow-[0_26px_70px_-42px_rgba(15,23,42,0.38)] lg:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.18),rgba(14,165,233,0)_70%)]" />
        <div className="pointer-events-none absolute -left-20 bottom-0 size-64 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.14),rgba(16,185,129,0)_70%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(14,165,233,0.85),rgba(16,185,129,0.85),transparent)]" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              <Sparkles className="size-3.5" />
              Eco Spark Platform
            </span>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Build a structured pipeline for sustainability innovation.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Eco Spark helps scientists, administrators, and members move
                ideas from concept to implementation with clear workflows and
                measurable impact.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/idea"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white shadow-[0_10px_25px_-16px_rgba(15,23,42,0.8)] transition-colors hover:bg-slate-800"
              >
                Explore ideas
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
              >
                Create account
              </Link>
            </div>
          </div>

          <aside className="grid gap-3 rounded-[1.6rem] border border-slate-700 bg-[linear-gradient(155deg,#020617_0%,#0f172a_50%,#1e293b_100%)] p-5 text-white shadow-[0_22px_45px_-28px_rgba(2,6,23,0.95)]">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-300">
                Active ideas
              </p>
              <p className="mt-2 text-2xl font-semibold">120+</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-300">
                Review speed
              </p>
              <p className="mt-2 text-2xl font-semibold">3.4x faster</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-300">
                Teams onboarded
              </p>
              <p className="mt-2 text-2xl font-semibold">40+</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Feature Section
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Built for every role in the innovation lifecycle.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              className="rounded-3xl border border-slate-200 bg-[linear-gradient(165deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
                <feature.icon className="size-5" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-950">
                {feature.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Process
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            A clear path from concept to adoption.
          </h2>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map((step, index) => (
            <article
              key={step.label}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Step {index + 1}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {step.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {step.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#082f49_0%,#0f172a_38%,#052e16_100%)] p-6 text-white shadow-[0_24px_70px_-42px_rgba(2,6,23,0.85)] sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(125,211,252,0.8),rgba(134,239,172,0.8),transparent)]" />

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
              Visual Section
            </p>
            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight">
              An editorial section with online-hosted imagery for a stronger
              first impression.
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
              This block adds a more polished visual layer to the homepage while
              keeping the rest of the content grounded in your existing platform
              story.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {inspirationPanels.map((panel) => (
              <article
                key={panel.title}
                className="group relative min-h-[22rem] overflow-hidden rounded-[1.7rem] border border-white/10 bg-slate-950"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${panel.imageUrl})` }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.18),rgba(15,23,42,0.82)_55%,rgba(2,6,23,0.96)_100%)]" />

                <div className="relative flex h-full flex-col justify-between p-5">
                  <div className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-100 backdrop-blur-sm">
                    {panel.eyebrow}
                  </div>

                  <div className="space-y-3">
                    <p className="inline-flex w-fit rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100">
                      {panel.stat}
                    </p>
                    <h3 className="text-2xl font-semibold leading-tight">
                      {panel.title}
                    </h3>
                    <p className="text-sm leading-6 text-slate-200">
                      {panel.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Testimonials
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Trusted by teams delivering measurable outcomes.
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.name}
              className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <Quote className="absolute right-5 top-5 size-5 text-slate-200" />
              <p className="text-sm leading-7 text-slate-700">
                "{testimonial.quote}"
              </p>
              <p className="mt-5 text-sm font-semibold text-slate-950">
                {testimonial.name}
              </p>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                {testimonial.role}
              </p>
            </article>
          ))}
        </div>
      </section>

      <HomeIdeasShowcase />

      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_45%,#f8fafc_100%)] p-6 shadow-[0_28px_80px_-50px_rgba(15,23,42,0.38)] sm:p-8">
        <div className="pointer-events-none absolute -right-20 top-0 size-60 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.14),rgba(56,189,248,0)_72%)]" />
        <div className="pointer-events-none absolute -left-20 bottom-0 size-60 rounded-full bg-[radial-gradient(circle,rgba(74,222,128,0.12),rgba(74,222,128,0)_72%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.8),rgba(74,222,128,0.75),transparent)]" />

        <div className="relative space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Pricing
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Plans that scale with your organization.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Start lean, move into team operations, or roll out a tailored
                workspace with governance and onboarding.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="rounded-full border border-white/80 bg-white/85 px-3 py-2 shadow-[0_14px_32px_-26px_rgba(15,23,42,0.28)] backdrop-blur">
                Transparent plan structure
              </span>
              <span className="rounded-full border border-white/80 bg-white/85 px-3 py-2 shadow-[0_14px_32px_-26px_rgba(15,23,42,0.28)] backdrop-blur">
                Flexible team growth
              </span>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {pricingPlans.map((plan) => (
              <article
                key={plan.name}
                className={`relative overflow-hidden rounded-[1.8rem] border p-6 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.35)] transition-transform duration-200 hover:-translate-y-1 ${
                  plan.featured
                    ? "border-slate-950 bg-[linear-gradient(165deg,#020617_0%,#0f172a_62%,#111827_100%)] text-white"
                    : "border-slate-200 bg-white/95 text-slate-900"
                }`}
              >
                {plan.featured ? (
                  <>
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#22d3ee,#38bdf8,#4ade80)]" />
                    <div className="pointer-events-none absolute -right-16 top-10 size-36 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.18),rgba(34,211,238,0)_72%)]" />
                  </>
                ) : (
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(148,163,184,0.45),transparent)]" />
                )}

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <p
                          className={`text-xs font-semibold uppercase tracking-[0.18em] ${plan.featured ? "text-slate-300" : "text-slate-500"}`}
                        >
                          {plan.name}
                        </p>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                            plan.featured
                              ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-200"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                          }`}
                        >
                          {plan.label}
                        </span>
                      </div>

                      <div>
                        <p className="text-4xl font-semibold tracking-tight">
                          {plan.price}
                        </p>
                        <p
                          className={`mt-2 text-sm ${plan.featured ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {plan.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`mt-5 rounded-[1.35rem] border p-4 ${
                      plan.featured
                        ? "border-white/10 bg-white/5 text-slate-200"
                        : "border-slate-200 bg-slate-50/85 text-slate-600"
                    }`}
                  >
                    <p className="text-sm leading-6">{plan.note}</p>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-start gap-3 text-sm"
                      >
                        <span
                          className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border ${
                            plan.featured
                              ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-200"
                              : "border-emerald-200 bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          <CheckCircle2 className="size-3.5" />
                        </span>
                        <span
                          className={
                            plan.featured ? "text-slate-100" : "text-slate-700"
                          }
                        >
                          {highlight}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 border-t border-slate-200/15 pt-5">
                    <Link
                      href={plan.ctaHref}
                      className={`inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-medium transition-all ${
                        plan.featured
                          ? "bg-white text-slate-950 hover:bg-slate-100 hover:shadow-[0_18px_34px_-24px_rgba(255,255,255,0.45)]"
                          : "bg-slate-950 text-white hover:bg-slate-800 hover:shadow-[0_18px_34px_-24px_rgba(15,23,42,0.45)]"
                      }`}
                    >
                      {plan.ctaLabel}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_40%,#0ea5e9_100%)] p-8 text-white shadow-[0_20px_60px_-36px_rgba(2,6,23,0.8)] lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
              Call to action
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Ready to launch your sustainability workspace?
            </h2>
            <p className="text-sm leading-7 text-slate-200 sm:text-base">
              Bring your team into one platform for submission, review, and
              adoption.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
            >
              Get started
            </Link>
            <Link
              href="/community"
              className="rounded-full border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            >
              Talk to community
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
