import type { Metadata } from "next";
import { snProFont } from "@/fonts/font";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/heroui-pro/toast";
import { QueryProvider } from "@/components/query-provider";
import { SITE_DESCRIPTION, SITE_OG_IMAGE_PATH, SITE_TITLE, SITE_URL, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    // Sub-pages can set their own title; we add the suffix automatically.
    template: "%s — Raltic",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Raltic",
  keywords: [
    "AI-native operators",
    "agent workflow workspace",
    "AI-native teams",
    "AI agent workflows",
    "workflow rooms",
    "Claude Code agents",
    "Codex agents",
    "agentic workflows",
    "human-in-the-loop agents",
  ],
  authors: [{ name: "Raltic" }],
  creator: "Raltic",
  publisher: "Raltic",
  category: "productivity",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Raltic",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: absoluteUrl(SITE_OG_IMAGE_PATH),
        width: 1200,
        height: 630,
        alt: "Raltic - launch your first agent workflow",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl(SITE_OG_IMAGE_PATH)],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    types: {
      "application/rss+xml": absoluteUrl("/blog/feed.xml"),
      "text/plain": absoluteUrl("/llms.txt"),
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false as const,
  viewportFit: "cover",
  // Match the dominant page background (`--background` ≈ #f6f4f0), not
  // the hero accent (#fbf8f3) — otherwise the mobile address bar stays
  // cream while the page scrolls into pure-white / warm-cream sections,
  // creating a visible two-tone seam between Safari chrome and content.
  themeColor: "#f6f4f0",
  // App ships light-only for now. Don't advertise "dark" support — that
  // makes Chrome apply dark UA defaults to native form controls and
  // causes the autofill text to render invisible white-on-white.
  colorScheme: "light" as const,
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
        "antialiased",
        snProFont.variable,
      )}
    >
      <body className="min-h-screen bg-background">
        {/* QueryProvider wraps Toast so toast helpers can read query
            cache too (e.g. "agent went offline" toast tied to /me).
            See lib/query-client.ts for defaults rationale. */}
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
