import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleHelp } from "lucide-react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { MarketingFooter } from "@/components/marketing/footer";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { ANSWER_PAGES } from "@/lib/editorial-content";
import { SITE_CONTENT_UPDATED, absoluteUrl, breadcrumbJsonLd, itemListJsonLd, jsonLdGraph, marketingMetadata, webPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "AI Agent Workflow Questions, Answered",
  description: "Clear answers about workflow rooms, approval gates, Claude Code and Codex, source-code boundaries, bridge runtimes, review, and orchestration.",
  path: "/answers",
  keywords: ["AI agent questions", "AI workflow FAQ", "agent orchestration answers", "Raltic FAQ"],
});

export default function AnswersPage() {
  return (
    <>
      <JsonLdScript data={jsonLdGraph([
        webPageJsonLd({ path: "/answers", name: "AI agent workflow questions, answered", description: metadata.description as string, type: "CollectionPage", dateModified: SITE_CONTENT_UPDATED, mainEntity: { "@id": `${absoluteUrl("/answers")}#itemlist` } }),
        itemListJsonLd({ path: "/answers", name: "Raltic answers", items: ANSWER_PAGES.map((answer) => ({ name: answer.question, description: answer.metaDescription, path: `/answers/${answer.slug}` })) }),
        breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Answers", path: "/answers" }]),
      ])} />
      <section className="border-b border-black/[0.07] bg-[#fafaf8] pt-28 pb-20 sm:pt-32"><Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Answers", href: "/answers" }]} /><div className="mx-auto mt-8 max-w-3xl px-6 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-violet-200 bg-violet-50 text-violet-700"><CircleHelp className="h-5 w-5" aria-hidden="true" /></div><h1 className="mt-7 text-balance text-5xl font-medium leading-[1.05] text-zinc-900 sm:text-6xl">AI agent workflow questions, answered.</h1><p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-zinc-600">Direct, bounded answers for evaluators, teams, and AI search systems. Each page separates shipped Raltic behavior from general workflow guidance.</p></div></section>
      <section className="bg-white px-6 py-20 sm:py-24"><div className="mx-auto max-w-5xl"><div className="grid gap-4 md:grid-cols-2">{ANSWER_PAGES.map((answer) => <Link key={answer.slug} href={`/answers/${answer.slug}`} className="group rounded-lg border border-zinc-200 bg-white p-6 transition-colors hover:border-violet-300 hover:bg-violet-50/30"><h2 className="text-xl font-medium leading-snug text-zinc-900">{answer.question}</h2><p className="mt-3 line-clamp-4 text-sm leading-relaxed text-zinc-600">{answer.shortAnswer}</p><span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-violet-700">Read the answer <ArrowRight className="h-4 w-4" aria-hidden="true" /></span></Link>)}</div></div></section>
      <section className="border-y border-black/[0.07] bg-[#faf9f6] px-6 py-20"><div className="mx-auto max-w-4xl text-center"><p className="text-xs font-medium uppercase text-violet-700">Need the full method?</p><h2 className="mt-4 text-3xl font-medium text-zinc-900 sm:text-4xl">Answers link to deeper guides and product evidence.</h2><p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-600">The answer library handles narrow questions. The blog covers broader operating methods, and feature pages define exactly what Raltic ships today.</p><div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"><MarketingButton href="/blog" ctaTarget="answers_blog">Read field guides</MarketingButton><MarketingButton href="/features" variant="secondary" ctaTarget="answers_features">Explore features</MarketingButton></div></div></section>
      <MarketingFooter lead={<div className="mx-auto max-w-3xl text-center"><h2 className="text-balance text-3xl font-medium text-zinc-900 sm:text-4xl">See the answers in an actual workflow.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">Private beta is free and starts from a workflow, not an empty chat.</p><div className="mt-7 flex justify-center"><MarketingButton href="/signup?workflow=launch-readiness" ctaTarget="answers_footer_signup">Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" /></MarketingButton></div></div>} />
    </>
  );
}
