# SEO/GEO visual content expansion

Date: 2026-08-13

## Goal

Make Raltic's public content easier to scan, easier to cite, and more useful during product evaluation. The work expands the existing content engine without changing the product truth boundary or creating unsupported comparison claims.

## Content architecture

The existing feature, audience, blog, answer, and comparison registries remain authoritative. A new buyer-guide registry powers `/best` and `/best/[guide]`. Buyer guides group products by the job they are best suited to instead of assigning unverifiable numeric scores.

The expansion adds:

- Four first-party-sourced product comparisons: LangGraph, CrewAI, Microsoft Copilot Studio, and Gemini Enterprise Agent Platform.
- Three buyer guides with an explicit inclusion and evaluation method.
- Two long-form guides about platform evaluation and build-versus-buy decisions.
- Six direct-answer pages for high-intent orchestration, handoff, audit-trail, and platform-selection questions.

## Visual system

Content pages use semantic HTML visuals rather than decorative illustrations:

- Route maps turn article or answer sections into a numbered reading path.
- Evidence boards turn flat bullet lists into labeled, scannable signals.
- Fit maps separate the jobs each compared product handles best.
- Buyer-guide matrices expose product type, best-fit job, review model, and implementation lift.

These components remain server-rendered, keyboard-accessible, mobile-safe, and lightweight. They use Lucide icons already installed in the repository and do not add dependencies.

## Internal links

Every long-form article receives contextual links inside the reading flow, not only a generic related-content footer. Links connect four intent layers:

1. Definition or method article.
2. Direct-answer page.
3. Feature, workflow, or audience page.
4. Comparison or buyer guide.

The sitemap, `llms.txt`, `llms-full.txt`, `ai-index.json`, RSS, footer, mobile navigation, and IndexNow changed-URL mapping consume the same registries so discovery files cannot drift from rendered pages.

## Claim and ranking policy

- Competitor capabilities come from current official documentation.
- Raltic comparisons state where the competitor is the better fit.
- Buyer guides disclose that Raltic publishes them and that inclusion is not paid.
- “Best” means best for a named job under the published method, not a universal winner.
- Preview capabilities are labeled as preview when material to the decision.
- Review state in Raltic is not described as external-system authorization.

## Verification

Validation covers type checking, lint, all package tests, IndexNow selection tests, OpenNext build, anonymous route access, canonical metadata, structured data, visible FAQs, internal-link validity, horizontal overflow, and desktop/mobile screenshots. Production claims require the repository's live-verification matrix after deployment.
