"use client";

import { useEffect, useMemo, useState } from "react";
import { Hash, Lock, Search, X } from "lucide-react";
import {
  Dialog, DialogPortal, DialogBackdrop, DialogPopup,
  DialogHeader, DialogTitle, DialogPanel, DialogFooter, DialogClose,
} from "@/components/heroui-pro/dialog";
import { Button } from "@/components/heroui-pro/button";
import { Input } from "@/components/heroui-pro/input";
import { Field, FieldLabel } from "@/components/heroui-pro/field";
import { Radio, RadioGroup } from "@/components/heroui-pro/radio";
import { Checkbox } from "@/components/heroui-pro/checkbox";
import { Alert, AlertDescription } from "@/components/heroui-pro/alert";
import { Chip } from "@/components/heroui-pro/chip";
import { api, ApiError, type Agent } from "@/lib/api";

interface Props {
  serverId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

/** Trimmed person + agent shapes used in the picker. Refetched each
 *  time the dialog opens; in-memory only — no React Query cache, since
 *  the workspace member list barely changes during a session and a
 *  fresh fetch beats stale data when the user just invited someone. */
type WorkspaceMember = { userId: string; name: string; email: string | null; image: string | null };

export function CreateChannelDialog({ serverId, open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"public" | "private">("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Picker data
  const [members, setMembers] = useState<WorkspaceMember[] | null>(null);
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  // Reset all transient state each time the dialog opens — leftover
  // selections from a previous open are almost always a UX bug (user
  // expects a clean slate). Keep `name` blank too.
  useEffect(() => {
    if (!open) return;
    setName(""); setDescription(""); setType("public");
    setSelectedMembers(new Set()); setSelectedAgents(new Set());
    setQuery(""); setError(null);
    let cancelled = false;
    (async () => {
      try {
        const [m, a, me] = await Promise.all([
          api.listMembers(serverId),
          api.listAgents().then(r => r.agents.filter(ag => ag.serverId === serverId)),
          api.me(),
        ]);
        if (cancelled) return;
        setMyUserId(me.subject.userId ?? null);
        // Hide self from the picker — creator is always added by the
        // server, so showing them in the list creates a "why can't I
        // uncheck me?" UX trap.
        setMembers(m.members.filter(p => p.userId !== me.subject.userId).map(p => ({
          userId: p.userId, name: p.name, email: p.email, image: p.image,
        })));
        setAgents(a);
      } catch {
        if (cancelled) return;
        setMembers([]); setAgents([]);
      }
    })();
    return () => { cancelled = true; };
  }, [open, serverId]);

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(m =>
      m.name.toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q));
  }, [members, query]);
  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    const q = query.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(a =>
      a.displayName.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
  }, [agents, query]);

  const totalSelected = selectedMembers.size + selectedAgents.size;

  function toggleMember(id: string) {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAgent(id: string) {
    setSelectedAgents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError(null);
    try {
      const res = await api.createChannel({
        serverId,
        name,
        description: description || undefined,
        type,
        initialMemberIds: selectedMembers.size > 0 ? [...selectedMembers] : undefined,
        initialAgentIds: selectedAgents.size > 0 ? [...selectedAgents] : undefined,
      });
      // Tell the sidebar to refetch so the new channel shows up
      // immediately. Same event the /channels page dispatches on join.
      window.dispatchEvent(new CustomEvent("raltic:channels-changed"));
      onCreated?.(res.id);
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
            <DialogTitle>Create workflow room</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogPanel>
              <div className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="channel-name">Name</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {type === "private" ? <Lock className="h-3.5 w-3.5" /> : <Hash className="h-3.5 w-3.5" />}
                    </span>
                    <Input
                      id="channel-name"
                      aria-label="Room name"
                      className="pl-7"
                      value={name}
                      required
                      pattern="[a-z0-9_-]+"
                      maxLength={64}
                      onChange={(e) => setName((e.target as HTMLInputElement).value.toLowerCase())}
                      placeholder="e.g. launch-readiness"
                      autoFocus
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    This becomes the room URL and sidebar label. Use lowercase letters, numbers, dashes, or underscores.
                  </p>
                </Field>
                <Field>
                  <FieldLabel htmlFor="channel-desc">Description <span className="text-muted-foreground">(optional)</span></FieldLabel>
                  <Input
                    id="channel-desc"
                    aria-label="Room description"
                    value={description}
                    onChange={(e) => setDescription((e.target as HTMLInputElement).value)}
                    placeholder="What workflow does this room own?"
                    maxLength={2000}
                  />
                </Field>
                <Field>
                  <FieldLabel id="create-channel-visibility-label">Visibility</FieldLabel>
                  <RadioGroup
                    aria-labelledby="create-channel-visibility-label"
                    value={type}
                    onValueChange={(next) => setType(next === "private" ? "private" : "public")}
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    {(["public", "private"] as const).map((t) => (
                      <Radio
                        key={t}
                        value={t}
                        controlClassName="mt-0.5"
                      >
                        <div className="flex items-center gap-2 font-medium">
                          {t === "public" ? <Hash className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                          {t === "public" ? "Public" : "Private"}
                        </div>
                        <div className={`mt-0.5 text-[11px] ${type === t ? "text-foreground/80" : "text-muted-foreground"}`}>
                          {t === "public"
                            ? "Anyone in the workspace can find and join this room."
                            : "Only invited members can see this room."}
                        </div>
                      </Radio>
                    ))}
                  </RadioGroup>
                </Field>

                {/* Member / agent picker */}
                <Field>
                  <FieldLabel htmlFor="create-channel-member-search">
                    Add members <span className="text-muted-foreground">(optional)</span>
                    {totalSelected > 0 && (
                      <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium">
                        {totalSelected} selected
                      </span>
                    )}
                  </FieldLabel>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="create-channel-member-search"
                      aria-label="Search people or agents"
                      className="pl-7"
                      placeholder="Search people or agents"
                      value={query}
                      onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-border bg-[var(--surface-secondary)]">
                    {members === null || agents === null ? (
                      <p className="px-3 py-4 text-center text-xs text-muted-foreground">Loading…</p>
                    ) : filteredMembers.length === 0 && filteredAgents.length === 0 ? (
                      <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                        {query
                          ? "No matches."
                          : "You're the only one here — you can add members later."}
                      </p>
                    ) : (
                      <>
                        {filteredMembers.length > 0 && (
                          <div className="border-b">
                            <div className="px-3 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">People</div>
                            {filteredMembers.map((m) => (
                              <PickerRow
                                key={`u:${m.userId}`}
                                checked={selectedMembers.has(m.userId)}
                                onToggle={() => toggleMember(m.userId)}
                                avatar={m.image ? (
                                  <img src={m.image} alt="" className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[10px] font-semibold text-[var(--accent-soft-foreground)] ring-1 ring-accent/15">
                                    {m.name.slice(0, 1).toUpperCase()}
                                  </div>
                                )}
                                primary={m.name}
                                secondary={m.email ?? ""}
                              />
                            ))}
                          </div>
                        )}
                        {filteredAgents.length > 0 && (
                          <div>
                            <div className="px-3 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Agents</div>
                            {filteredAgents.map((a) => (
                              <PickerRow
                                key={`a:${a.id}`}
                                checked={selectedAgents.has(a.id)}
                                onToggle={() => toggleAgent(a.id)}
                                avatar={
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--warning-soft)] text-[10px] font-semibold text-[var(--warning-soft-foreground)] ring-1 ring-warning/15">
                                    {a.displayName.slice(0, 1).toUpperCase()}
                                  </div>
                                }
                                primary={a.displayName}
                                secondary={`${a.runtime} · @${a.name}`}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {totalSelected > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[...selectedMembers].map((id) => {
                        const m = members?.find(x => x.userId === id);
                        if (!m) return null;
                        return (
                          <SelectedChip key={`cu:${id}`} label={m.name} onRemove={() => toggleMember(id)} />
                        );
                      })}
                      {[...selectedAgents].map((id) => {
                        const a = agents?.find(x => x.id === id);
                        if (!a) return null;
                        return (
                          <SelectedChip key={`ca:${id}`} label={a.displayName} agent onRemove={() => toggleAgent(id)} />
                        );
                      })}
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {myUserId
                      ? "You'll be added automatically. Add others now or invite them later from room settings."
                      : "You'll be added automatically."}
                  </p>
                </Field>

                {error && (
                  <Alert variant="error">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </DialogPanel>
            <DialogFooter className="flex justify-end gap-2">
              <DialogClose render={<Button variant="outline" type="button">Cancel</Button>} />
              <Button type="submit" loading={loading}>Create room</Button>
            </DialogFooter>
          </form>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}

function PickerRow({ checked, onToggle, avatar, primary, secondary }: {
  checked: boolean; onToggle: () => void; avatar: React.ReactNode;
  primary: string; secondary?: string;
}) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={() => onToggle()}
      aria-label={secondary ? `${primary}, ${secondary}` : primary}
      surface="list"
      className="w-full rounded-none border-0 px-3 py-2 text-sm"
      controlClassName="mt-1"
      contentClassName="flex min-w-0 flex-1 items-center gap-2.5"
    >
      {avatar}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-foreground">{primary}</div>
        {secondary && (
          <div className={`truncate text-[10.5px] ${checked ? "text-foreground/80" : "text-muted-foreground"}`}>{secondary}</div>
        )}
      </div>
    </Checkbox>
  );
}

function SelectedChip({ label, agent, onRemove }: { label: string; agent?: boolean; onRemove: () => void }) {
  return (
    <Chip size="sm" variant="soft" color={agent ? "warning" : "accent"} className="gap-1 pr-1 text-[11px] font-medium">
      {label}
      <Button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        variant="ghost"
        size="icon-xs"
        className="h-5 w-5 hover:bg-black/10"
      >
        <X className="h-3 w-3" />
      </Button>
    </Chip>
  );
}
