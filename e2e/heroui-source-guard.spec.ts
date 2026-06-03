import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const WEB_SRC = path.join(ROOT, "apps/web/src");

const BUSINESS_RAW_CONTROL_ALLOWLIST = new Map<string, RegExp[]>([
  ["components/heroui-pro/dialog.tsx", [/<button\b/]],
  ["components/heroui-pro/alert-dialog.tsx", [/<button\b/]],
  ["components/heroui-pro/input.tsx", [/<input\b/]],
]);

const DIRECT_HEROUI_ALLOWLIST = new Set([
  "components/heroui-pro/accordion.tsx",
  "components/heroui-pro/alert-dialog.tsx",
  "components/heroui-pro/alert.tsx",
  "components/heroui-pro/button.tsx",
  "components/heroui-pro/card.tsx",
  "components/heroui-pro/checkbox.tsx",
  "components/heroui-pro/chip.tsx",
  "components/heroui-pro/confirm-dialog.tsx",
  "components/heroui-pro/dialog.tsx",
  "components/heroui-pro/field.tsx",
  "components/heroui-pro/input.tsx",
  "components/heroui-pro/menu.tsx",
  "components/heroui-pro/radio.tsx",
  "components/heroui-pro/scroll-shadow.tsx",
  "components/heroui-pro/select.tsx",
  "components/heroui-pro/tabs.tsx",
  "components/heroui-pro/textarea.tsx",
  "components/heroui-pro/toast.tsx",
]);

const DIRECT_HEROUI_PRO_ALLOWLIST = new Set([
  "components/message-area.tsx",
  "components/sidebar.tsx",
  "components/workspace-shell.tsx",
  "components/heroui-pro/select.tsx",
]);

test("apps/web business UI stays behind HeroUI Pro wrappers", () => {
  const files = listFiles(WEB_SRC).filter((file) => file.endsWith(".tsx"));
  const rawControlViolations: string[] = [];
  const directHeroUiViolations: string[] = [];
  const directHeroUiProViolations: string[] = [];

  for (const file of files) {
    const rel = toRel(file);
    const source = stripComments(fs.readFileSync(file, "utf8"));
    const allowPatterns = BUSINESS_RAW_CONTROL_ALLOWLIST.get(rel) ?? [];

    for (const tag of ["button", "input", "select", "textarea", "dialog"]) {
      const pattern = new RegExp(`<${tag}\\b`, "g");
      const allowed = allowPatterns.some((allowedPattern) => allowedPattern.test(source));
      if (!allowed && pattern.test(source)) {
        rawControlViolations.push(`${rel}: raw <${tag}>`);
      }
    }

    if (!DIRECT_HEROUI_ALLOWLIST.has(rel) && /from\s+["']@heroui\/react\//.test(source)) {
      directHeroUiViolations.push(rel);
    }

    if (!DIRECT_HEROUI_PRO_ALLOWLIST.has(rel) && /from\s+["']@heroui-pro\/react\//.test(source)) {
      directHeroUiProViolations.push(rel);
    }
  }

  expect(rawControlViolations).toEqual([]);
  expect(directHeroUiViolations).toEqual([]);
  expect(directHeroUiProViolations).toEqual([]);
});

test("HeroUI form controls expose explicit accessible names", () => {
  const files = listFiles(WEB_SRC)
    .filter((file) => file.endsWith(".tsx"))
    .filter((file) => !toRel(file).startsWith("components/heroui-pro/"));
  const violations: string[] = [];

  for (const file of files) {
    const rel = toRel(file);
    const source = stripComments(fs.readFileSync(file, "utf8"));
    for (const tag of ["Input", "Select", "Textarea", "RadioGroup", "Checkbox"]) {
      for (const openingTag of jsxOpeningTags(source, tag)) {
        if (!/\saria-label=|\saria-labelledby=/.test(openingTag)) {
          violations.push(`${rel}: <${tag}> missing aria-label/aria-labelledby`);
        }
      }
    }
  }

  expect(violations).toEqual([]);
});

test("workspace fallbacks and overlays do not regress to legacy raw shells", () => {
  const forbiddenPatterns: Array<[string, RegExp]> = [
    ["legacy raw error card", /rounded-lg border bg-card p-6 text-center shadow-sm/],
    ["legacy raw mention popover", /bg-popover p-1 text-popover-foreground shadow-md/],
    ["legacy mention active cyan state", /bg-cyan-500\/10 text-foreground ring-1 ring-cyan-500\/25/],
    ["legacy mention agent raw cyan badge", /rounded-full bg-cyan-500\/10 px-1 py-px text-\[9px\][^"]*text-cyan-700/],
    ["legacy chat header cyan icon surface", /border-cyan-200 bg-cyan-50 text-cyan-700/],
    ["legacy reaction selected cyan state", /border-cyan-400 bg-cyan-50 text-cyan-700/],
    ["legacy new dm raw cyan agent badge", /rounded-full bg-cyan-500\/10 px-1 py-px text-\[8px\][^"]*text-cyan-700/],
    ["legacy invite preset cyan hover", /hover:border-cyan-500\/40 hover:bg-cyan-500\/5/],
    ["legacy agent chip page-level primary override", /bg-primary\/10 text-primary ring-1 ring-primary\/15/],
    ["legacy member avatar cyan fallback", /rounded-full bg-cyan-500\/10 text-\[[^\]]+\] font-semibold text-cyan-700/],
    ["legacy settings member avatar cyan fallback", /rounded-full bg-cyan-500\/10 text-xs font-medium text-cyan-700/],
    ["legacy settings avatar cyan fallback", /rounded-(?:full|2xl) bg-cyan-500\/10 text-2xl font-semibold text-cyan-700/],
    ["legacy selected member chip cyan surface", /bg-cyan-500\/10 text-cyan-700 dark:text-cyan-300/],
    ["legacy agent detail cyan tab selected state", /border-cyan-600 text-cyan-700 dark:border-cyan-400 dark:text-cyan-400/],
    ["legacy channel visibility button selection", /aria-pressed=\{(?:type|channel\.type) === t\}/],
    ["legacy agent option button selection", /aria-pressed=\{(?:runtimeMode|runtime|model) ===/],
    ["legacy picker checkbox button selection", /aria-pressed=\{checked\}/],
    ["legacy setup wizard raw stage panel", /rounded border bg-muted\/30 p-4/],
    ["legacy setup wizard raw card panel", /rounded border bg-card p-3 text-xs/],
    ["legacy setup wizard raw dashed panel", /rounded border border-dashed bg-card p-3/],
    ["legacy setup wizard raw notice", /rounded border border-(?:cyan|amber)-500\/(?:30|40) bg-(?:cyan|amber)-50/],
    ["legacy setup wizard raw help list", /space-y-2 rounded border bg-card p-3/],
    ["legacy setup wizard runtime selected state", /border-cyan-500\/60 bg-cyan-500\/5/],
    ["legacy setup wizard manual runtime control", /checked \? "border-cyan-500"/],
    ["legacy setup wizard runtime chip color names", /chipTone=["'](?:cyan|amber|violet|rose)["']/],
    ["legacy setup wizard underline install tabs", /rounded-none border-b-2/],
    ["legacy setup wizard raw desktop panel", /border-dashed bg-background/],
    ["legacy setup wizard polling amber dot", /animate-pulse rounded-full bg-amber-500/],
    ["legacy setup wizard terminal success atom color", /text-emerald-400["'][^>]*>\[bridge\] ready/],
    ["legacy setup wizard success icon atom color", /CheckCircle2 className=["']h-4 w-4 text-emerald-600["']/],
    ["legacy setup wizard success text atom color", /text-emerald-700 dark:text-emerald-400/],
    ["legacy setup wizard local command block", /function CopyableCommand[\s\S]*data-raltic-terminal-command/],
    ["legacy workspace pane raw terminal preview", /<pre data-raltic-terminal-preview/],
    ["legacy settings invite success panel", /border-emerald-500\/40 bg-emerald-50/],
    ["legacy settings invite success text atom color", /text-emerald-800/],
    ["legacy attachment raw card", /rounded-md border bg-card/],
    ["legacy workspace pane raw panel", /border-t bg-card/],
    ["legacy quick reaction raw shell", /flex w-fit gap-1 rounded-xl border border-border bg-background p-1 shadow-sm/],
    ["legacy raw terminal command block", /rounded border bg-zinc-900 text-zinc-100/],
    ["low-contrast terminal label", /text-zinc-500["'][^>]*>\s*terminal\s*</],
    ["low-contrast terminal command preview", /text-zinc-500["'][^>]*>\s*\$/],
    ["legacy desktop launch raw status tile", /border-amber-400\/30 bg-amber-50\/50/],
    ["legacy desktop launch muted card status", /["']border-border bg-card["']/],
    ["legacy channel action raw white trigger", /border-zinc-200\/80 bg-white\/80/],
    ["legacy agent detail tabs raw card background", /className=["']shrink-0 border-b border-border\/70 bg-card["']/],
    ["legacy radio raw card background", /bg-card\/40/],
    ["legacy page-level default workspace selected state", /border-cyan-500\/40 bg-cyan-500\/5/],
    ["legacy page-level radio selected state", /border-cyan-500\/55 bg-cyan-500\/10/],
    ["legacy page-level checkbox selected state", /checked \? "!bg-cyan-500\/10"/],
    ["legacy workspace switcher active state", /bg-cyan-500\/8 text-cyan-700/],
    ["legacy user pill dark raw white surface", /dark:bg-white\/5/],
    ["legacy active navigation left rail", /border-l-2/],
    ["ambiguous task move label", /other\.label\.split\(" "\)\[0\]/],
    ["legacy workspace page cyan tone", /bg-cyan-500\/10 text-cyan-700/],
    ["legacy workspace page amber tone", /bg-amber-500\/10 text-amber-700/],
    ["legacy workspace tone prop color name", /tone=["'](?:cyan|amber|emerald|violet)["']/],
    ["legacy muted entity icon surface", /h-[89] w-[89][^"]*bg-muted text-muted-foreground/],
    ["legacy settings connector bare muted icon", /<Icon className=["']h-4 w-4 shrink-0 text-muted-foreground["']/],
    ["legacy empty-state bare muted icon", /mx-auto flex h-8 w-8 items-center justify-center text-muted-foreground\/60/],
  ];
  const violations: string[] = [];

  for (const file of listFiles(WEB_SRC).filter((candidate) => candidate.endsWith(".tsx"))) {
    const rel = toRel(file);
    const source = stripComments(fs.readFileSync(file, "utf8"));
    for (const [label, pattern] of forbiddenPatterns) {
      if (pattern.test(source)) violations.push(`${rel}: ${label}`);
    }
  }

  expect(violations).toEqual([]);
});

test("workspace app semantic states do not use legacy hue atom classes", () => {
  const workspaceAppRoot = path.join(WEB_SRC, "app/s");
  const componentFiles = [
    "components/sidebar.tsx",
    "components/user-pill.tsx",
    "components/workspace-pane.tsx",
    "components/workspace-switcher.tsx",
    "components/workspace-page.tsx",
    "components/settings-shared.tsx",
  ].map((rel) => path.join(WEB_SRC, rel));
  const files = [
    ...listFiles(workspaceAppRoot).filter((file) => file.endsWith(".tsx")),
    ...componentFiles,
  ];
  const forbidden = /(?:bg|text|border)-(?:cyan|amber|emerald|violet|rose|blue|red)-\d{2,3}(?:\/\d+)?/;
  const violations: string[] = [];

  for (const file of files) {
    const source = stripComments(fs.readFileSync(file, "utf8"));
    if (forbidden.test(source)) violations.push(toRel(file));
  }

  expect(violations).toEqual([]);
});

test("brand identity entry points use Raltic tokens instead of legacy hue atoms", () => {
  const files = [
    "app/not-found.tsx",
    "components/brand.tsx",
    "components/user-pill.tsx",
    "components/workspace-switcher.tsx",
  ].map((rel) => path.join(WEB_SRC, rel));
  const forbidden = /(?:bg|text|border|ring|from|via|to)-(?:cyan|amber|emerald|violet|rose|blue|red)-\d{2,3}(?:\/\d+)?|rgba\((?:6,\s*182,\s*212|245,\s*158,\s*11|34,\s*211,\s*238|103,\s*232,\s*249)/;
  const violations: string[] = [];

  for (const file of files) {
    const source = stripComments(fs.readFileSync(file, "utf8"));
    if (forbidden.test(source)) violations.push(toRel(file));
  }

  expect(violations).toEqual([]);
});

test("marketing shared surfaces use Raltic tokens instead of legacy hue atom classes", () => {
  const files = [
    "app/(marketing)/runtimes/page.tsx",
    "components/marketing-nav.tsx",
    "components/marketing/marketing-button.tsx",
    "components/marketing/runtime-page.tsx",
    "components/marketing/section-header.tsx",
    "components/marketing/waitlist-form.tsx",
  ].map((rel) => path.join(WEB_SRC, rel));
  const forbidden = /(?:bg|text|border|ring|from|via|to)-(?:cyan|amber|emerald|violet|rose|blue|red)-\d{2,3}(?:\/\d+)?|rgba\((?:6,\s*182,\s*212|245,\s*158,\s*11|34,\s*211,\s*238|103,\s*232,\s*249)/;
  const violations: string[] = [];

  for (const file of files) {
    const source = stripComments(fs.readFileSync(file, "utf8"));
    if (forbidden.test(source)) violations.push(toRel(file));
  }

  expect(violations).toEqual([]);
});

test("marketing chrome shared surfaces avoid fixed dark palette atoms", () => {
  const files = [
    "components/marketing/shell.tsx",
    "components/marketing-nav.tsx",
    "components/marketing/footer.tsx",
  ].map((rel) => path.join(WEB_SRC, rel));
  const forbidden = /(?:bg|text|border|ring|from|via|to)-(?:zinc|slate|neutral|stone|gray|cyan|amber|emerald|violet|rose|blue|red)-\d{2,3}(?:\/\d+)?|\b(?:bg|text|border|ring)-(?:black|white)(?:\/\d+)?\b|rgba\((?:0,\s*0,\s*0|255,\s*255,\s*255|6,\s*182,\s*212|245,\s*158,\s*11|34,\s*211,\s*238|103,\s*232,\s*249)/;
  const violations: string[] = [];

  for (const file of files) {
    const source = stripComments(fs.readFileSync(file, "utf8"));
    if (forbidden.test(source)) violations.push(toRel(file));
  }

  expect(violations).toEqual([]);
});

test("marketing FAQ accordion avoids fixed palette atoms", () => {
  const files = [
    "components/marketing/faq-list.tsx",
  ].map((rel) => path.join(WEB_SRC, rel));
  const forbidden = /(?:bg|text|border|ring|from|via|to)-(?:zinc|slate|neutral|stone|gray|cyan|amber|emerald|violet|rose|blue|red)-\d{2,3}(?:\/\d+)?|rgba\((?:6,\s*182,\s*212|245,\s*158,\s*11|34,\s*211,\s*238|103,\s*232,\s*249)/;
  const violations: string[] = [];

  for (const file of files) {
    const source = stripComments(fs.readFileSync(file, "utf8"));
    if (forbidden.test(source)) violations.push(toRel(file));
  }

  expect(violations).toEqual([]);
});

test("runtime detail template avoids fixed palette atoms", () => {
  const files = [
    "components/marketing/runtime-page.tsx",
    "components/marketing/section-header.tsx",
  ].map((rel) => path.join(WEB_SRC, rel));
  const forbidden = /(?:bg|text|border|ring|from|via|to)-(?:zinc|slate|neutral|stone|gray|cyan|amber|emerald|violet|rose|blue|red)-\d{2,3}(?:\/\d+)?|\b(?:bg|text|border|ring)-(?:black|white)(?:\/\d+)?\b|rgba\((?:6,\s*182,\s*212|245,\s*158,\s*11|34,\s*211,\s*238|103,\s*232,\s*249)/;
  const violations: string[] = [];

  for (const file of files) {
    const source = stripComments(fs.readFileSync(file, "utf8"));
    if (forbidden.test(source)) violations.push(toRel(file));
  }

  expect(violations).toEqual([]);
});

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full);
    return [full];
  });
}

function toRel(file: string) {
  return path.relative(WEB_SRC, file).split(path.sep).join("/");
}

function stripComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function jsxOpeningTags(source: string, tag: string): string[] {
  const tags: string[] = [];
  const pattern = new RegExp(`<${tag}\\b`, "g");
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    const start = match.index;
    let quote: string | null = null;
    let braceDepth = 0;

    for (let i = start; i < source.length; i += 1) {
      const char = source[i];
      const prev = source[i - 1];

      if (quote) {
        if (char === quote && prev !== "\\") quote = null;
        continue;
      }

      if (char === "\"" || char === "'" || char === "`") {
        quote = char;
        continue;
      }
      if (char === "{") {
        braceDepth += 1;
        continue;
      }
      if (char === "}") {
        braceDepth = Math.max(0, braceDepth - 1);
        continue;
      }
      if (char === ">" && braceDepth === 0) {
        tags.push(source.slice(start, i + 1));
        pattern.lastIndex = i + 1;
        break;
      }
    }
  }

  return tags;
}
