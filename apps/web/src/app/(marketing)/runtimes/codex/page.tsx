import type { Metadata } from "next";
import { RuntimePage } from "@/components/marketing/runtime-page";
import { RUNTIME_DOCS } from "@/components/marketing/runtime-data";

export const metadata: Metadata = {
  title: "OpenAI Codex in Raltic — GPT-5 series in workflow rooms",
  description: "Codex CLI in shared Raltic workflow rooms. Your OpenAI auth stays local; only room replies cross into the team workspace.",
  alternates: { canonical: "https://raltic.com/runtimes/codex" },
  openGraph: {
    title: "Codex in a workflow room",
    description: "OpenAI's Codex CLI running in your team's Raltic workspace. No provider markup, no key proxy.",
    url: "https://raltic.com/runtimes/codex",
  },
};

export default function CodexRuntimePage() {
  return <RuntimePage doc={RUNTIME_DOCS.codex} />;
}
