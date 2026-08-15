import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { ContentRouteMap, ContextLink, DecisionPathVisual, EvidenceBoard } from "@/components/marketing/content-visuals";
import { MarketingFaqList } from "@/components/marketing/faq-list";
import { MarketingFooter } from "@/components/marketing/footer";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { ANSWER_PAGES, getAnswerPage } from "@/lib/editorial-content";
import { SITE_CONTENT_UPDATED, absoluteUrl, breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, marketingMetadata, webPageJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ answer: string }> };

export function generateStaticParams() {
  return ANSWER_PAGES.map((answer) => ({ answer: answer.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const answer = getAnswerPage((await params).answer);
  return answer ? marketingMetadata({ title: answer.metaTitle, description: answer.metaDescription, path: `/answers/${answer.slug}`, keywords: answer.keywords }) : {};
}

export default async function AnswerDetailPage({ params }: Props) {
  const answer = getAnswerPage((await params).answer);
  if (!answer) notFound();
  const path = `/answers/${answer.slug}`;

  return (
    <>
      <JsonLdScript data={jsonLdGraph([
        webPageJsonLd({ path, name: answer.question, description: answer.metaDescription, dateModified: SITE_CONTENT_UPDATED, mainEntity: { "@id": `${absoluteUrl(path)}#faq` } }),
        faqPageJsonLd([{ q: answer.question, a: answer.shortAnswer }, ...answer.faqs], path),
        breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Answers", path: "/answers" }, { name: answer.question, path }]),
      ])} />
      <article>
        <header className="border-b border-black/[0.07] bg-[#fafaf8] pt-28 pb-16 sm:pt-32">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Answers", href: "/answers" }, { name: answer.question, href: path }]} />
          <div className="mx-auto mt-8 max-w-4xl px-6 text-center">
            <p className="text-xs font-medium uppercase text-violet-700">Direct answer</p>
            <h1 className="mt-5 text-balance text-4xl font-medium leading-[1.08] text-zinc-900 sm:text-6xl">{answer.question}</h1>
            <p className="mx-auto mt-7 max-w-3xl border-s-2 border-violet-400 bg-violet-50 p-6 text-left text-lg leading-relaxed text-zinc-800">{answer.shortAnswer}</p>
            <p className="mt-5 text-sm text-zinc-500">Reviewed by Raltic Research · Updated August 15, 2026</p>
          </div>
        </header>

        <ContentRouteMap eyebrow="Answer map" title="The short answer first, followed by the operating details and next decision." items={answer.sections.map((section) => ({ label: section.title, href: `#${section.id}` }))} emphasis="insight" />

        <div className="bg-white px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl">
            {answer.visual && <DecisionPathVisual visual={answer.visual} />}
            {answer.sections.map((section, index) => {
              const related = answer.related[index % answer.related.length];
              return (
                <section id={section.id} key={section.id} className="scroll-mt-28 border-b border-zinc-200 py-10 first:pt-0">
                  <span className="font-mono text-[11px] text-violet-700">{String(index + 1).padStart(2, "0")}</span>
                  <h2 className="mt-3 text-3xl font-medium leading-tight text-zinc-900">{section.title}</h2>
                  <p className="mt-4 text-lg font-medium leading-relaxed text-zinc-800">{section.answer}</p>
                  {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 text-base leading-8 text-zinc-600">{paragraph}</p>)}
                  {section.bullets && <EvidenceBoard title="Answer checklist" items={section.bullets} emphasis={index % 2 === 0 ? "insight" : "evidence"} />}
                  {related && <ContextLink href={related.href} label={related.label} description="Use this connected page for the deeper method, product boundary, or next workflow step." emphasis="insight" />}
                </section>
              );
            })}
          </div>
        </div>

        <section id="faq" className="border-y border-black/[0.07] bg-[#fafaf8] px-6 py-20"><div className="mx-auto max-w-4xl"><p className="text-xs font-medium uppercase text-violet-700">Related questions</p><h2 className="mt-4 text-3xl font-medium text-zinc-900">Keep the boundary clear.</h2><MarketingFaqList idPrefix={`answer-${answer.slug}`} items={answer.faqs} theme="light" /></div></section>
        <section className="bg-white px-6 py-14"><div className="mx-auto max-w-5xl"><h2 className="text-xl font-medium text-zinc-900">Go deeper</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{answer.related.map((link) => <Link key={link.href} href={link.href} className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 text-sm font-medium text-zinc-800 hover:border-violet-300 hover:text-violet-700">{link.label}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link>)}</div></div></section>
      </article>
      <MarketingFooter lead={<div className="mx-auto max-w-3xl text-center"><h2 className="text-balance text-3xl font-medium text-zinc-900 sm:text-4xl">Test the answer in one bounded workflow.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">See the brief, evidence, tasks, and human decision in one room.</p><div className="mt-7 flex justify-center"><MarketingButton href="/signup?workflow=launch-readiness" ctaTarget={`answer_${answer.slug}_signup`}>Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" /></MarketingButton></div></div>} />
    </>
  );
}
