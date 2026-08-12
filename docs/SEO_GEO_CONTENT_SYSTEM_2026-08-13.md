# Raltic SEO and GEO content system

Updated: 2026-08-13

## Objective

Build a search and answer-engine acquisition path that moves from category education to product evaluation and then to one concrete trial workflow:

1. Educational query -> source-linked blog guide or direct answer.
2. Problem or role query -> feature, Built For, or workflow page.
3. Alternative query -> fair, first-party-sourced comparison.
4. Commercial evaluation -> pricing, security, about, connectors, and runtimes.
5. Trial -> `/signup?workflow=launch-readiness` or another explicit workflow intent.

The product truth boundary is fixed: Raltic is a workflow-room platform for humans and AI agents. Claude Code and OpenAI Codex are verified bridge runtimes. OpenClaw and Hermes remain experimental. Raltic exposes review state and evidence but does not claim to enforce every external action.

## Pin.com structure review

The research snapshot used Pin's public homepage, blog, feature, Built For, comparison, MCP, robots, sitemap index, and sitemap on 2026-08-13:

- <https://www.pin.com/>
- <https://www.pin.com/blog/>
- <https://www.pin.com/features/ai-recruiting-agent/>
- <https://www.pin.com/built-for/founders/>
- <https://www.pin.com/compare/pin-vs-juicebox/>
- <https://www.pin.com/blog/pin-vs-sourcewhale/>
- <https://www.pin.com/mcp/>
- <https://www.pin.com/robots.txt>
- <https://www.pin.com/sitemap-index.xml>

The direct sitemap snapshot contained roughly 490 URLs: about 465 blog URLs, eight Built For URLs, five comparison URLs, and five feature URLs. The durable pattern is not the raw count. It is a connected topic network:

- Navigation exposes Features, Built For, Customers, Blog, and Pricing as evaluation paths.
- Feature pages combine a direct benefit, capabilities, operating boundary, integrations, trust, pricing, FAQ, and CTA.
- Built For pages translate the same product into persona-specific problems, workflows, proof, and FAQs.
- Comparison pages lead with the fit decision, use side-by-side criteria, say when the competitor is better, and cite current sources.
- Blog pages answer the query early, expose author and freshness, provide a table of contents and sources, and link into commercial pages.
- Internal links connect category education, use cases, product proof, and trial rather than leaving articles as isolated traffic pages.

Raltic adopts that architecture without copying Pin's claims, recruiting taxonomy, page volume, or metrics.

## Shipped content clusters

| Cluster | Hub | Detail pages | Primary intent |
| --- | --- | ---: | --- |
| Features | `/features` | 6 | Product capability |
| Built For | `/built-for` | 6 | Role and use case |
| Comparisons | `/compare` | 7 | Alternative evaluation |
| Blog | `/blog` | 8 | Category education |
| Answers | `/answers` | 8 | Direct question / GEO |
| Workflows | `/workflows` | 4 | Task-specific trial |
| Runtimes | `/runtimes` | 2 indexed | Runtime compatibility |
| Connectors | `/connectors` | 3 | Integration evaluation |

Trust and conversion pages include `/about`, `/pricing`, `/security`, `/privacy`, `/terms`, and `/glossary`.

## Search-intent boundaries

Avoid keyword cannibalization by giving each cluster a different job:

- Blog: broad method and research. Example: how to design an approval workflow.
- Answers: narrow direct question. Example: how approval gates work.
- Features: what Raltic ships and its current boundary.
- Built For: why a role would use the operating model and what first value looks like.
- Workflows: a specific starter, evidence path, and signup intent.
- Comparisons: product-fit decision based on current official sources.

Every detail page links to at least three pages from other clusters.

## GEO discovery surfaces

- `/llms.txt`: concise product facts, public URLs, crawler policy, and trial path.
- `/llms-full.txt`: citation-ready summaries of features, audiences, workflows, comparisons, connectors, articles, and answers.
- `/ai-index.json`: machine-readable canonical facts, limitations, discovery endpoints, freshness, and every public content URL.
- `/blog/feed.xml`: RSS discovery for editorial updates.
- `/sitemap.xml`: every public indexable canonical URL with real update dates.
- `/robots.txt`: public search and answer-retrieval access while private and noindex surfaces remain blocked.
- IndexNow: changed URL selection is derived from the sitemap and content registry paths.

## Source and claim policy

1. Product claims must be supported by current repository behavior or an existing verified product disclosure.
2. Competitor claims must link to current first-party documentation.
3. General risk and governance guidance should prefer NIST, OWASP, and primary vendor engineering research.
4. Separate facts, inference, recommendations, and current limitations.
5. Never convert an in-review state into a claim of automatic external authorization.
6. Never describe local repository access as fully local model processing; name the model-provider path separately.
7. Every article exposes published and updated dates, author entity, sources, Article schema, FAQ, and related paths.

## Release checklist

1. Check unique slug, title, description, primary query, direct answer, FAQ, and three cross-cluster links.
2. Verify every external comparison and article source still resolves to the claimed first-party content.
3. Confirm canonical URL, one H1, structured data, social metadata, and mobile overflow.
4. Confirm the route is anonymous in middleware and present in sitemap, llms files, AI index, and IndexNow mapping.
5. Run TypeScript, lint, IndexNow unit tests, focused Playwright, full web build, and production live verification.
6. Submit changed sitemap URLs through the existing IndexNow deployment workflow only after the production URL is live.
