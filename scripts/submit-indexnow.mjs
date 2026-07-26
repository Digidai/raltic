#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { changedIndexableUrls, deletedIndexableUrls } from "./indexnow-changes.mjs";

const execFileAsync = promisify(execFile);

const configUrl = new URL("../apps/web/src/lib/indexnow.config.json", import.meta.url);
const config = JSON.parse(await readFile(configUrl, "utf8"));

const siteUrl = new URL(process.env.INDEXNOW_SITE_URL ?? "https://raltic.com");
const endpoint = process.env.INDEXNOW_ENDPOINT ?? config.endpoint;
const sitemapUrl = process.env.INDEXNOW_SITEMAP_URL ?? new URL("/sitemap.xml", siteUrl).toString();
const keyLocation = new URL(`/${config.key}.txt`, siteUrl).toString();
const maxUrls = Number.parseInt(process.env.INDEXNOW_LIMIT ?? "10000", 10);
const args = process.argv.slice(2);
const dryRun = process.env.INDEXNOW_DRY_RUN === "1" || args.includes("--dry-run");
const changedSinceIndex = args.indexOf("--changed-since");
const changedSince = changedSinceIndex >= 0 ? args[changedSinceIndex + 1] : null;
const previousSitemapIndex = args.indexOf("--previous-sitemap");
const previousSitemap = previousSitemapIndex >= 0 ? args[previousSitemapIndex + 1] : null;
if (changedSinceIndex >= 0 && !changedSince) {
  throw new Error("--changed-since requires a git ref");
}
if (previousSitemapIndex >= 0 && !previousSitemap) {
  throw new Error("--previous-sitemap requires a file path");
}
const consumedArgs = new Set();
if (changedSinceIndex >= 0) {
  consumedArgs.add(changedSinceIndex);
  consumedArgs.add(changedSinceIndex + 1);
}
if (previousSitemapIndex >= 0) {
  consumedArgs.add(previousSitemapIndex);
  consumedArgs.add(previousSitemapIndex + 1);
}
const explicitUrls = args.filter((arg, index) => (
  arg !== "--dry-run"
  && arg !== "--"
  && !consumedArgs.has(index)
));

function normalizeUrl(value) {
  return new URL(value, siteUrl).toString();
}

function decodeXmlText(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'");
}

function parseSitemapUrls(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1].trim())
    .map(decodeXmlText)
    .map(normalizeUrl)
    .filter((url) => new URL(url).host === siteUrl.host);
}

async function urlsFromSitemap() {
  const response = await fetch(sitemapUrl, {
    headers: {
      accept: "application/xml,text/xml;q=0.9,*/*;q=0.1",
      "user-agent": "Raltic IndexNow submitter/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap ${sitemapUrl}: HTTP ${response.status}`);
  }
  return parseSitemapUrls(await response.text());
}

async function urlsFromPreviousSitemap(filePath) {
  if (!filePath) return [];
  return parseSitemapUrls(await readFile(filePath, "utf8"));
}

async function changedFilesFromGit(ref) {
  const { stdout } = await execFileAsync("git", ["diff", "--name-only", ref, "HEAD"], {
    cwd: new URL("..", import.meta.url),
  });
  return stdout.split("\n").map((line) => line.trim()).filter(Boolean);
}

const sitemapUrls = await urlsFromSitemap();
const previousSitemapUrls = await urlsFromPreviousSitemap(previousSitemap);
const deletedUrls = deletedIndexableUrls(previousSitemapUrls, sitemapUrls);
let selectedUrls;
if (explicitUrls.length > 0) {
  selectedUrls = explicitUrls.map(normalizeUrl);
} else if (changedSince) {
  const changedFiles = await changedFilesFromGit(changedSince);
  selectedUrls = changedIndexableUrls(changedFiles, sitemapUrls);
  if (selectedUrls.length === 0 && deletedUrls.length === 0) {
    console.log(JSON.stringify({
      endpoint,
      sitemapUrl,
      changedSince,
      changedFiles,
      previousSitemap,
      skipped: true,
      reason: "No indexable public URL changed.",
    }, null, 2));
    process.exit(0);
  }
} else {
  selectedUrls = sitemapUrls;
}

const urlList = [...new Set([...selectedUrls, ...deletedUrls])]
  .slice(0, maxUrls);

if (urlList.length === 0) {
  throw new Error("No URLs available for IndexNow submission.");
}

const payload = {
  host: siteUrl.host,
  key: config.key,
  keyLocation,
  urlList,
};

if (dryRun) {
  console.log(JSON.stringify({ endpoint, sitemapUrl, changedSince, previousSitemap, deletedUrls, payload }, null, 2));
  process.exit(0);
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "content-type": "application/json; charset=utf-8",
    "user-agent": "Raltic IndexNow submitter/1.0",
  },
  body: JSON.stringify(payload),
});

const body = await response.text();
console.log(JSON.stringify({
  endpoint,
  status: response.status,
  ok: response.ok || response.status === 202,
  submitted: urlList.length,
  body,
}, null, 2));

if (!response.ok && response.status !== 202) {
  process.exit(1);
}
