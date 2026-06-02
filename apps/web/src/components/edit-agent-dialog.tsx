"use client";

import { useEffect, useState } from "react";
import {
  Dialog, DialogPortal, DialogBackdrop, DialogPopup,
  DialogHeader, DialogTitle, DialogPanel, DialogFooter, DialogClose,
} from "@/components/heroui-pro/dialog";
import { Button } from "@/components/heroui-pro/button";
import { Input } from "@/components/heroui-pro/input";
import { Select } from "@/components/heroui-pro/select";
import { Textarea } from "@/components/heroui-pro/textarea";
import { Field, FieldLabel } from "@/components/heroui-pro/field";
import { Alert, AlertDescription } from "@/components/heroui-pro/alert";
import { Radio, RadioGroup } from "@/components/heroui-pro/radio";
import { api, ApiError, CLOUD_MODELS, RUNTIME_LABEL, RUNTIME_MODELS, type Agent, type RuntimeId } from "@/lib/api";
import { GeneratedAvatar } from "./generated-avatar";
import { randomAvatarSeed } from "@/lib/avatar";
import { Shuffle } from "lucide-react";

interface Props {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function EditAgentDialog({ agent, open, onOpenChange, onSaved }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [runtime, setRuntime] = useState<RuntimeId>("claude");
  const [model, setModel] = useState<string>("sonnet");
  const [avatarSeed, setAvatarSeed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agent && open) {
      const isCloud = agent.runtimeMode !== undefined && agent.runtimeMode !== "bridge";
      setDisplayName(agent.displayName);
      setDescription(agent.description ?? "");
      setSystemPrompt(agent.systemPrompt ?? "");
      // Legacy-runtime guard (backcompat H3): agent.runtime is plain
      // TEXT post-S2 and may be "gemini"/"copilot" from before the
      // removal. RUNTIME_MODELS[unknown] is undefined → .includes
      // would throw and crash the dialog. Fall back to "claude" so
      // the user can pick a real runtime, with a banner via setError.
      const effectiveRuntime: RuntimeId = (RUNTIME_MODELS as Record<string, readonly string[] | undefined>)[agent.runtime]
        ? (agent.runtime as RuntimeId)
        : "claude";
      setRuntime(effectiveRuntime);
      const allowed = isCloud ? CLOUD_MODELS : RUNTIME_MODELS[effectiveRuntime];
      setModel(allowed.includes(agent.model) ? agent.model : allowed[0]);
      setAvatarSeed(agent.avatarSeed ?? null);
      setError(
        !isCloud && effectiveRuntime !== agent.runtime
          ? `This agent's previous runtime "${agent.runtime}" was removed. Pick a new runtime + model and save.`
          : null,
      );
    }
  }, [agent, open]);

  function pickRuntime(r: RuntimeId) {
    setRuntime(r);
    if (!RUNTIME_MODELS[r].includes(model)) setModel(RUNTIME_MODELS[r][0]);
  }

  if (!agent) return null;
  const isCloud = agent.runtimeMode !== undefined && agent.runtimeMode !== "bridge";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agent) return;
    setLoading(true); setError(null);
    try {
      await api.updateAgent(agent.id, {
        displayName,
        description: description || null,
        systemPrompt: systemPrompt || null,
        ...(isCloud ? {} : { runtime }),
        model,
        avatarSeed,
      });
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {agent.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogPanel>
              <div className="space-y-4">
                <Field>
                  <FieldLabel id="edit-agent-avatar-label">Avatar</FieldLabel>
                  <div aria-labelledby="edit-agent-avatar-label" className="flex items-center gap-3">
                    <GeneratedAvatar id={agent.id} name={displayName || agent.displayName} seed={avatarSeed} size="xl" />
                    <div className="flex flex-col gap-1.5">
                      <Button type="button" variant="outline" size="sm"
                        onClick={() => setAvatarSeed(randomAvatarSeed())}>
                        <Shuffle className="mr-1 h-3.5 w-3.5" /> Shuffle
                      </Button>
                      {avatarSeed && (
                        <Button type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => setAvatarSeed(null)}
                          className="text-xs text-muted-foreground">
                          Reset to default
                        </Button>
                      )}
                    </div>
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-agent-identifier">Identifier</FieldLabel>
                  <Input id="edit-agent-identifier" aria-label="Agent identifier" value={agent.name} disabled
                    title="Identifier is immutable. Delete + recreate the agent if you need a different one." />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-agent-display-name">Display name</FieldLabel>
                  <Input id="edit-agent-display-name" aria-label="Agent display name" value={displayName} required maxLength={120}
                    onChange={(e) => setDisplayName((e.target as HTMLInputElement).value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-agent-description">Description</FieldLabel>
                  <Input id="edit-agent-description" aria-label="Agent description" value={description}
                    onChange={(e) => setDescription((e.target as HTMLInputElement).value)}
                    placeholder="What does this agent do?" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-agent-system-prompt">System prompt</FieldLabel>
                  <Textarea id="edit-agent-system-prompt" aria-label="Agent system prompt" value={systemPrompt} rows={8}
                    onChange={(e) => setSystemPrompt((e.target as HTMLTextAreaElement).value)}
                    placeholder="You are an expert in…" />
                </Field>
                {!isCloud && (
                  <Field>
                    <FieldLabel id="edit-agent-runtime-label">Runtime</FieldLabel>
                    <RadioGroup
                      aria-labelledby="edit-agent-runtime-label"
                      value={runtime}
                      onValueChange={(next) => pickRuntime(next as RuntimeId)}
                      className="grid gap-2 sm:grid-cols-2"
                    >
                      {(["claude", "codex", "openclaw", "hermes"] as RuntimeId[]).map((r) => (
                        <Radio
                          key={r}
                          value={r}
                          controlClassName="mt-1"
                        >
                          <div className="font-medium">{RUNTIME_LABEL[r]}</div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {RUNTIME_MODELS[r].join(" / ")}
                          </p>
                        </Radio>
                      ))}
                    </RadioGroup>
                  </Field>
                )}
                {!isCloud && runtime !== agent.runtime && (
                  <Alert variant="warning" className="text-[11px]">
                    <AlertDescription>
                      Switching runtime starts a fresh session — past context won&apos;t carry over. DM history is preserved.
                    </AlertDescription>
                  </Alert>
                )}
                <Field>
                  <FieldLabel htmlFor="edit-agent-model">Model</FieldLabel>
                  <Select
                    id="edit-agent-model"
                    aria-label="Agent model"
                    value={model}
                    onValueChange={setModel}
                    options={(isCloud ? CLOUD_MODELS : RUNTIME_MODELS[runtime]).map((m) => ({
                      value: m,
                      label: m,
                    }))}
                    triggerClassName="w-full"
                    className="w-full"
                  />
                </Field>
                <p className="text-xs text-muted-foreground">
                  Changes to system prompt take effect on the next message —
                  the bridge restarts the agent process to apply them.
                </p>
                {error && (
                  <Alert variant="error">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </DialogPanel>
            <DialogFooter className="flex justify-end gap-2">
              <DialogClose render={<Button variant="outline" type="button">Cancel</Button>} />
              <Button type="submit" loading={loading}>Save</Button>
            </DialogFooter>
          </form>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
