import type { Metadata } from "next";

export const SITE_URL = "https://raltic.com";
export const SITE_NAME = "Raltic";
export const SITE_TITLE = "Raltic - Launch agent workflows in minutes";
export const SITE_DESCRIPTION =
  "Raltic helps AI-native operators start cloud agent workflow rooms, review the next action, and keep approvals and memory visible before adding local runtimes.";
export const SITE_LAST_MODIFIED = new Date("2026-06-19T00:00:00.000Z");
export const SITE_PUBLISHED_AT = new Date("2026-06-01T00:00:00.000Z");
export const SITE_OG_IMAGE_PATH = "/opengraph-image";
export const SITE_ICON_PATH = "/icon";

export type FaqEntry = {
  q: string;
  a: string;
};

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function marketingMetadata({
  title,
  description,
  path,
  keywords,
  robots,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  robots?: Metadata["robots"];
}): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(SITE_OG_IMAGE_PATH);
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${title} - ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots,
  };
}

// Official, verifiable profiles that identify the Raltic entity elsewhere.
// `sameAs` strengthens entity recognition for both Google's knowledge graph
// and AI engines (GEO). Only list profiles we actually control — do not pad
// with invented social handles.
const ORG_SAME_AS = ["https://github.com/Digidai/raltic"];

// Topics the entity is authoritative about — a lightweight, accurate GEO
// signal that helps AI engines associate Raltic with these queries.
const ORG_KNOWS_ABOUT = [
  "AI agent workflows",
  "Human-in-the-loop AI",
  "Claude Code",
  "OpenAI Codex",
  "AI agent orchestration",
  "Workflow automation for teams",
];

export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: SITE_NAME,
    url: SITE_URL,
    email: "hello@raltic.com",
    description: SITE_DESCRIPTION,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(SITE_ICON_PATH),
      width: 32,
      height: 32,
    },
    sameAs: ORG_SAME_AS,
    contactPoint: {
      "@type": "ContactPoint",
      email: "hello@raltic.com",
      contactType: "customer support",
      availableLanguage: ["English"],
    },
    knowsAbout: ORG_KNOWS_ABOUT,
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: { "@id": absoluteUrl("/#organization") },
    inLanguage: "en-US",
  };
}

export function softwareApplicationJsonLd(): Record<string, unknown> {
  return {
    "@type": "SoftwareApplication",
    "@id": absoluteUrl("/#software"),
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, macOS, Windows, Linux",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    // Accurate capability summary — helps AI engines describe what Raltic
    // does without paraphrasing marketing copy. Keep each item true to
    // shipped behavior (see the homepage truth audit).
    featureList: [
      "Workflow rooms where humans and AI agents share one accountable space",
      "Verified Claude Code and OpenAI Codex bridge runtimes",
      "Cloud agents that run with zero local install",
      "Human approval gates before agent output reaches customers",
      "Local-first execution that keeps source code and provider keys on your machine",
      "GitHub, Linear, and Notion connectors with per-agent grants",
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      category: "Private beta",
    },
    publisher: { "@id": absoluteUrl("/#organization") },
  };
}

export function webPageJsonLd({
  path,
  name,
  description,
  mainEntity,
  type = "WebPage",
}: {
  path: string;
  name: string;
  description: string;
  mainEntity?: Record<string, unknown>;
  type?: "WebPage" | "CollectionPage";
}): Record<string, unknown> {
  return {
    "@type": type,
    "@id": `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name,
    description,
    isPartOf: { "@id": absoluteUrl("/#website") },
    about: { "@id": absoluteUrl("/#software") },
    mainEntity,
    datePublished: SITE_PUBLISHED_AT.toISOString(),
    dateModified: SITE_LAST_MODIFIED.toISOString(),
    isAccessibleForFree: true,
    inLanguage: "en-US",
  };
}

export function faqPageJsonLd(items: FaqEntry[], path: string): Record<string, unknown> {
  return {
    "@type": "FAQPage",
    "@id": `${absoluteUrl(path)}#faq`,
    mainEntity: items.map((item, index) => ({
      "@type": "Question",
      "@id": `${absoluteUrl(path)}#faq-${index + 1}`,
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function itemListJsonLd({
  path,
  name,
  items,
}: {
  path: string;
  name: string;
  items: Array<{ name: string; description: string; path: string }>;
}): Record<string, unknown> {
  return {
    "@type": "ItemList",
    "@id": `${absoluteUrl(path)}#itemlist`,
    name,
    numberOfItems: items.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(item.path),
      name: item.name,
      description: item.description,
    })),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function jsonLdGraph(nodes: Array<Record<string, unknown>>): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
