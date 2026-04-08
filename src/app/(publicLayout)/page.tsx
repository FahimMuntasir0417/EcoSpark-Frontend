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
    detail: "Admins validate quality and route the strongest proposals forward.",
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
    highlights: [
      "Public idea browsing",
      "Basic profile and submissions",
      "Community feedback access",
    ],
    ctaLabel: "Start free",
    ctaHref: "/register",
  },
  {
    name: "Growth",
    price: "$29",
    subtitle: "Per member/month",
    highlights: [
      "Advanced moderation workspace",
      "Priority listing controls",
      "Role-specific analytics",
    ],
    ctaLabel: "Choose growth",
    ctaHref: "/register",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    subtitle: "For large organizations",
    highlights: [
      "Dedicated onboarding",
      "Policy and workflow customization",
      "Priority support and training",
    ],
    ctaLabel: "Contact sales",
    ctaHref: "/community",
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
                Eco Spark helps scientists, administrators, and members move ideas from
                concept to implementation with clear workflows and measurable impact.
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
              <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Active ideas</p>
              <p className="mt-2 text-2xl font-semibold">120+</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Review speed</p>
              <p className="mt-2 text-2xl font-semibold">3.4x faster</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Teams onboarded</p>
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
              <p className="mt-4 text-base font-semibold text-slate-950">{feature.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Process</p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            A clear path from concept to adoption.
          </h2>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map((step, index) => (
            <article key={step.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Step {index + 1}</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{step.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Testimonials</p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Trusted by teams delivering measurable outcomes.
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.name} className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <Quote className="absolute right-5 top-5 size-5 text-slate-200" />
              <p className="text-sm leading-7 text-slate-700">"{testimonial.quote}"</p>
              <p className="mt-5 text-sm font-semibold text-slate-950">{testimonial.name}</p>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{testimonial.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pricing</p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Plans that scale with your organization.
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-3xl border p-6 shadow-sm ${
                plan.featured ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-900"
              }`}
            >
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${plan.featured ? "text-slate-300" : "text-slate-500"}`}>
                {plan.name}
              </p>
              <p className="mt-3 text-3xl font-semibold">{plan.price}</p>
              <p className={`mt-1 text-sm ${plan.featured ? "text-slate-300" : "text-slate-600"}`}>{plan.subtitle}</p>

              <ul className="mt-5 space-y-2">
                {plan.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className={`mt-0.5 size-4 shrink-0 ${plan.featured ? "text-cyan-300" : "text-emerald-600"}`} />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                  plan.featured ? "bg-white text-slate-950 hover:bg-slate-100" : "bg-slate-950 text-white hover:bg-slate-800"
                }`}
              >
                {plan.ctaLabel}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_40%,#0ea5e9_100%)] p-8 text-white shadow-[0_20px_60px_-36px_rgba(2,6,23,0.8)] lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Call to action</p>
            <h2 className="text-3xl font-semibold tracking-tight">Ready to launch your sustainability workspace?</h2>
            <p className="text-sm leading-7 text-slate-200 sm:text-base">
              Bring your team into one platform for submission, review, and adoption.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/register" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100">
              Get started
            </Link>
            <Link href="/community" className="rounded-full border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15">
              Talk to community
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
