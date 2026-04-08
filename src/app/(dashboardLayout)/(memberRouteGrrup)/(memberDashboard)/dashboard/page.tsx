import Link from "next/link";

const memberLinks = [
  {
    title: "Browse Ideas",
    description: "Explore the full idea catalog available to members.",
    href: "/dashboard/browse-ideas",
  },
  {
    title: "Saved Ideas",
    description: "Return to the ideas you bookmarked for later review.",
    href: "/dashboard/saved-ideas",
  },
  {
    title: "Purchase Ideas",
    description: "Buy ideas and track the purchase records tied to your account.",
    href: "/dashboard/purches-idea",
  },
  {
    title: "My Votes",
    description: "Track the ideas you have supported or rated.",
    href: "/dashboard/my-votes",
  },
  {
    title: "My Comments",
    description: "Review your discussion history across idea pages.",
    href: "/dashboard/my-comments",
  },
];

export default function MemberDashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Member Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Use these shortcuts to move through the member workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {memberLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border bg-background p-4 transition-colors hover:border-foreground/20 hover:bg-muted/40"
          >
            <h3 className="font-medium">{link.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{link.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
