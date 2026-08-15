const STATIC_PAGE_FILES = new Map([
  ["apps/web/src/app/(marketing)/page.tsx", ["/"]],
  ["apps/web/src/components/home-cta.tsx", ["/"]],
  ["apps/web/src/app/(marketing)/workflows/page.tsx", ["/workflows"]],
  ["apps/web/src/app/(marketing)/runtimes/page.tsx", ["/runtimes"]],
  ["apps/web/src/app/(marketing)/compare/page.tsx", ["/compare"]],
  ["apps/web/src/app/(marketing)/best/page.tsx", ["/best"]],
  ["apps/web/src/app/(marketing)/features/page.tsx", ["/features"]],
  ["apps/web/src/app/(marketing)/built-for/page.tsx", ["/built-for"]],
  ["apps/web/src/app/(marketing)/blog/page.tsx", ["/blog"]],
  ["apps/web/src/app/(marketing)/answers/page.tsx", ["/answers"]],
  ["apps/web/src/app/(marketing)/about/page.tsx", ["/about"]],
  ["apps/web/src/app/(marketing)/pricing/page.tsx", ["/pricing"]],
  ["apps/web/src/app/(marketing)/connectors/page.tsx", ["/connectors"]],
  ["apps/web/src/app/(marketing)/glossary/page.tsx", ["/glossary"]],
  ["apps/web/src/app/(marketing)/indie/page.tsx", ["/indie"]],
  ["apps/web/src/app/(marketing)/security/page.tsx", ["/security"]],
  ["apps/web/src/app/(marketing)/privacy/page.tsx", ["/privacy"]],
  ["apps/web/src/app/(marketing)/terms/page.tsx", ["/terms"]],
]);

const GLOBAL_PUBLIC_FILES = [
  "apps/web/src/app/(marketing)/layout.tsx",
  "apps/web/src/app/layout.tsx",
  "apps/web/src/app/globals.css",
  "apps/web/src/app/opengraph-image.tsx",
  "apps/web/src/app/sitemap.ts",
  "apps/web/src/lib/seo.ts",
  "apps/web/src/components/marketing-nav.tsx",
  "apps/web/src/components/marketing/footer.tsx",
  "apps/web/src/components/marketing/shell.tsx",
];

function hasPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isContentFamilyFile(file, family) {
  return file.startsWith(`apps/web/src/lib/${family}`) && file.endsWith(".ts");
}

export function changedIndexableUrls(changedFiles, sitemapUrls) {
  const sitemap = sitemapUrls.map((value) => new URL(value));
  const allUrls = new Set(sitemap.map((url) => url.toString()));
  const selected = new Set();

  const includePath = (pathname) => {
    for (const url of sitemap) {
      if (url.pathname === pathname) selected.add(url.toString());
    }
  };
  const includePrefix = (prefix) => {
    for (const url of sitemap) {
      if (hasPrefix(url.pathname, prefix)) selected.add(url.toString());
    }
  };

  for (const file of changedFiles) {
    if (GLOBAL_PUBLIC_FILES.includes(file)
      || file.startsWith("apps/web/src/components/marketing/")
      || file === "apps/web/src/lib/indexnow.ts"
      || file === "apps/web/src/lib/indexnow.config.json") {
      for (const url of allUrls) selected.add(url);
      continue;
    }

    const staticPaths = STATIC_PAGE_FILES.get(file);
    if (staticPaths) {
      for (const path of staticPaths) includePath(path);
      continue;
    }

    if (file.includes("/workflows/[workflow]/") || file.endsWith("/lib/workflow-seo.ts") || file.endsWith("/lib/workflow-starters.ts")) {
      includePrefix("/workflows");
      continue;
    }
    if (file.includes("/compare/[competitor]/") || isContentFamilyFile(file, "comparison-seo")) {
      includePrefix("/compare");
      continue;
    }
    if (file.includes("/best/[guide]/") || isContentFamilyFile(file, "buyer-guide-content")) {
      includePrefix("/best");
      continue;
    }
    if (file.includes("/connectors/[connector]/") || file.endsWith("/lib/connector-seo.ts")) {
      includePrefix("/connectors");
      continue;
    }
    if (file.includes("/features/[feature]/") || file.endsWith("/lib/growth-content.ts")) {
      includePrefix("/features");
      if (file.endsWith("/lib/growth-content.ts")) includePrefix("/built-for");
      continue;
    }
    if (file.includes("/built-for/[audience]/")) {
      includePrefix("/built-for");
      continue;
    }
    if (file.includes("/blog/[article]/") || isContentFamilyFile(file, "editorial-content") || file.endsWith("/lib/editorial-connections.ts")) {
      includePrefix("/blog");
      if (isContentFamilyFile(file, "editorial-content")) includePrefix("/answers");
      continue;
    }
    if (file.includes("/answers/[answer]/")) {
      includePrefix("/answers");
      continue;
    }
    if (file.includes("/runtimes/") || file.endsWith("/components/marketing/runtime-data.ts") || file.endsWith("/components/marketing/runtime-page.tsx")) {
      includePrefix("/runtimes");
      continue;
    }

    // Unknown public marketing files are intentionally conservative. A future
    // route or shared component should be discoverable without first teaching
    // the deploy workflow its filename.
    if (file.startsWith("apps/web/src/app/(marketing)/")) {
      for (const url of allUrls) selected.add(url);
    }
  }

  return [...selected].sort();
}

export function deletedIndexableUrls(previousSitemapUrls, currentSitemapUrls) {
  const current = new Set(currentSitemapUrls.map((value) => new URL(value).toString()));
  return previousSitemapUrls
    .map((value) => new URL(value).toString())
    .filter((value) => !current.has(value))
    .sort();
}
