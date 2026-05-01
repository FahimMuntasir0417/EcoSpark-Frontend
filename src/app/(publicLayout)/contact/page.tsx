import type { Metadata } from "next";
import {
  ExternalLink,
  Github,
  Globe2,
  LifeBuoy,
  Server,
  Video,
} from "lucide-react";
import { ContactForm } from "../_components/contact-form";

export const metadata: Metadata = {
  title: "Contact Eco Spark",
  description:
    "Contact Eco Spark support using a validated request form connected to the real project repository.",
};

const contactLinks = [
  {
    label: "Live frontend",
    href: "https://eco-spark-frontend.vercel.app",
    icon: Globe2,
  },
  {
    label: "Backend API",
    href: "https://assignment-eco-spark.vercel.app",
    icon: Server,
  },
  {
    label: "Frontend repository",
    href: "https://github.com/FahimMuntasir0417/EcoSpark-Frontend",
    icon: Github,
  },
  {
    label: "Demo video",
    href: "https://drive.google.com/file/d/1ZzTSUULNzsSZ-n4m5TGL6SHEAomqg9z7/view",
    icon: Video,
  },
];

export default function ContactPage() {
  return (
    <main className="public-page-shell">
      <section className="grid gap-4">
        <p className="section-kicker">Contact</p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Send a structured Eco Spark support request.
        </h1>
        <p className="section-copy">
          Use this route for product support, backend setup issues, account
          access problems, and partnership questions related to the Eco Spark
          frontend and EcoSpark Hub backend.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <ContactForm />

        <aside className="grid content-start gap-4">
          <div className="surface-card p-5">
            <LifeBuoy className="size-6 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Support channels</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              The validated form prepares a complete request for the project
              issue tracker, including your topic, email, and message.
            </p>
          </div>

          <div className="surface-card grid gap-3 p-5">
            <p className="text-sm font-semibold">Project contact links</p>
            {contactLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-md border border-border bg-background p-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <item.icon className="size-4 text-primary" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <ExternalLink className="size-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
