#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const configUrl = new URL("../apps/web/src/lib/indexnow.config.json", import.meta.url);
const config = JSON.parse(await readFile(configUrl, "utf8"));

const siteUrl = new URL(process.env.INDEXNOW_SITE_URL ?? "https://raltic.com");
const endpoint = process.env.INDEXNOW_ENDPOINT ?? config.endpoint;
const sitemapUrl = process.env.INDEXNOW_SITEMAP_URL ?? new URL("/sitemap.xml", siteUrl).toString();
const keyLocation = new URL(`/${config.key}.txt`, siteUrl).toString();
const maxUrls = Number.parseInt(process.env.INDEXNOW_LIMIT ?? "10000", 10);
const dryRun = process.env.INDEXNOW_DRY_RUN === "1" || process.argv.includes("--dry-run");

const explicitUrls = process.argv
  .slice(2)
  .filter((arg) => arg !== "--dry-run");

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

const urlList = (explicitUrls.length > 0 ? explicitUrls.map(normalizeUrl) : await urlsFromSitemap())
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
  console.log(JSON.stringify({ endpoint, sitemapUrl, payload }, null, 2));
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
