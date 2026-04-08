import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans, Sora } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import { cn } from "@/lib/utils";
import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const headingFont = Sora({
  subsets: ["latin"],
  variable: "--font-brand",
});

const monoFont = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eco Spark",
  description:
    "A professional sustainability innovation platform for ideas, campaigns, and community collaboration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        bodyFont.variable,
        headingFont.variable,
        monoFont.variable,
        "font-sans",
      )}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col overflow-x-clip bg-background text-foreground"
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
