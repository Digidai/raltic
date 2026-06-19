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

export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: SITE_NAME,
    url: SITE_URL,
    email: "hello@raltic.com",
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(SITE_ICON_PATH),
      width: 32,
      height: 32,
    },
    sameAs: [SITE_URL],
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
  primaryEntity,
  type = "WebPage",
}: {
  path: string;
  name: string;
  description: string;
  primaryEntity?: Record<string, unknown>;
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
    primaryEntity,
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
