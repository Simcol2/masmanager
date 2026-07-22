"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Megaphone, Loader2, Pencil, Copy, Check, Plus, X, CalendarDays, Sparkles,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  CostumeTypeLabels,
  SocialGoalLabels, SocialPlatformLabels, PostingCadenceLabels,
  BrandToneLabels, TargetAudienceLabels,
  type SocialProfile, type SocialGoal, type SocialPlatform,
  type PostingCadence, type BrandTone, type TargetAudience, type SocialColor,
} from "@/types";
import { getSocialProfile, saveSocialProfile } from "@/lib/services/social";
import { buildSocialPlan, planSummary, type PlannedPost } from "@/lib/social-plan";

const SEASON = "2026";

// ── Draft type (what the wizard edits) ─────────────────────────────────────────
type Draft = {
  sectionName: string;
  slogan: string;
  description: string;
  colors: SocialColor[];
  goals: SocialGoal[];
  platforms: SocialPlatform[];
  cadence: PostingCadence;
  tones: BrandTone[];
  audiences: TargetAudience[];
  registrationOpen: string;
  registrationClose: string;
  bandLaunch: string;
  carnivalDate: string;
  customDates: { label: string; date: string }[];
};

const EMPTY_DRAFT: Draft = {
  sectionName: "", slogan: "", description: "", colors: [],
  goals: [], platforms: [], cadence: "few_weekly", tones: [], audiences: [],
  registrationOpen: "", registrationClose: "", bandLaunch: "", carnivalDate: "",
  customDates: [],
};

function dateToInput(d?: Date): string {
  if (!d) return "";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function inputToDate(s: string): Date | undefined {
  return s ? new Date(s + "T00:00:00") : undefined;
}
function profileToDraft(p: SocialProfile): Draft {
  return {
    sectionName: p.sectionName, slogan: p.slogan ?? "", description: p.description ?? "",
    colors: p.colors ?? [], goals: p.goals, platforms: p.platforms, cadence: p.cadence,
    tones: p.tones, audiences: p.audiences,
    registrationOpen: dateToInput(p.registrationOpen),
    registrationClose: dateToInput(p.registrationClose),
    bandLaunch: dateToInput(p.bandLaunch),
    carnivalDate: dateToInput(p.carnivalDate),
    customDates: (p.customDates ?? []).map(d => ({ label: d.label, date: dateToInput(d.date) })),
  };
}

// ── Small UI atoms ─────────────────────────────────────────────────────────────
const labelStyle = { fontSize: "0.72rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" as const, letterSpacing: "0.04em" };
const inputStyle = { width: "100%", border: "1px solid #E5E7EB", borderRadius: "0.375rem", padding: "0.5rem 0.7rem", fontSize: "0.9rem", color: "#111827", background: "#fff" };

function Chips<T extends string>({ options, selected, onToggle, color = "#7C3AED" }: {
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (v: T) => void;
  color?: string;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
      {options.map(o => {
        const on = selected.includes(o.value);
        return (
          <button key={o.value} type="button" onClick={() => onToggle(o.value)}
            style={{
              padding: "0.35rem 0.7rem", borderRadius: "999px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
              border: `1.5px solid ${on ? color : "#E5E7EB"}`,
              background: on ? `${color}12` : "#fff",
              color: on ? color : "#6B7280",
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Onboarding / edit wizard ───────────────────────────────────────────────────
function Wizard({ open, initial, onClose, onSaved }: {
  open: boolean; initial: Draft; onClose: () => void; onSaved: () => void;
}) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setD(initial); setStep(0); } }, [open, initial]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(prev => ({ ...prev, [k]: v }));
  const toggle = <K extends keyof Draft>(k: K, v: string) => setD(prev => {
    const arr = prev[k] as string[];
    return { ...prev, [k]: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] } as Draft;
  });

  async function handleSave() {
    setSaving(true);
    try {
      await saveSocialProfile(SEASON, {
        seasonId: SEASON,
        sectionName: d.sectionName.trim(),
        slogan: d.slogan.trim() || undefined,
        description: d.description.trim() || undefined,
        colors: d.colors.filter(c => c.hex),
        goals: d.goals, platforms: d.platforms, cadence: d.cadence,
        tones: d.tones, audiences: d.audiences,
        registrationOpen: inputToDate(d.registrationOpen),
        registrationClose: inputToDate(d.registrationClose),
        bandLaunch: inputToDate(d.bandLaunch),
        carnivalDate: inputToDate(d.carnivalDate),
        customDates: d.customDates
          .filter(c => c.label.trim() && c.date)
          .map(c => ({ label: c.label.trim(), date: inputToDate(c.date)! })),
      });
      onSaved();
      onClose();
    } finally { setSaving(false); }
  }

  const steps = ["Brand", "Strategy", "Key dates"];
  const canNext = step === 0 ? d.sectionName.trim().length > 0 : true;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent showCloseButton style={{ maxWidth: "32rem" }}>
        {/* Step header */}
        <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1rem" }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: "4px", borderRadius: "2px", background: i <= step ? "#7C3AED" : "#E5E7EB" }} />
              <div style={{ fontSize: "0.66rem", fontWeight: 600, color: i === step ? "#7C3AED" : "#9CA3AF", marginTop: "0.3rem" }}>{s}</div>
            </div>
          ))}
        </div>

        <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "0.25rem" }}>
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: 0 }}>Tell us about your section. This shapes the voice of every post.</p>
              <Field label="Section name">
                <input value={d.sectionName} onChange={e => set("sectionName", e.target.value)} placeholder="e.g. The Black Stars" style={inputStyle} />
              </Field>
              <Field label="Slogan (optional)">
                <input value={d.slogan} onChange={e => set("slogan", e.target.value)} placeholder="e.g. Shine on the road" style={inputStyle} />
              </Field>
              <Field label="Description">
                <textarea value={d.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="What is this section about?" style={{ ...inputStyle, resize: "vertical" }} />
              </Field>
              <Field label="Section colors">
                <ColorEditor colors={d.colors} onChange={c => set("colors", c)} />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <Field label="What are your goals?">
                <Chips options={enumOpts(SocialGoalLabels)} selected={d.goals} onToggle={v => toggle("goals", v)} />
              </Field>
              <Field label="Where will you post?">
                <Chips options={enumOpts(SocialPlatformLabels)} selected={d.platforms} onToggle={v => toggle("platforms", v)} color="#1A73E8" />
              </Field>
              <Field label="How active do you want to be?">
                <Chips options={enumOpts(PostingCadenceLabels)} selected={[d.cadence]} onToggle={v => set("cadence", v as PostingCadence)} color="#059669" />
              </Field>
              <Field label="What tone should the brand have?">
                <Chips options={enumOpts(BrandToneLabels)} selected={d.tones} onToggle={v => toggle("tones", v)} color="#FF6B35" />
              </Field>
              <Field label="Who are you trying to reach?">
                <Chips options={enumOpts(TargetAudienceLabels)} selected={d.audiences} onToggle={v => toggle("audiences", v)} color="#0891B2" />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: 0 }}>The dates that anchor your posting schedule. Leave any blank if unknown.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
                <Field label="Registration opens"><input type="date" value={d.registrationOpen} onChange={e => set("registrationOpen", e.target.value)} style={inputStyle} /></Field>
                <Field label="Registration closes"><input type="date" value={d.registrationClose} onChange={e => set("registrationClose", e.target.value)} style={inputStyle} /></Field>
                <Field label="Band launch"><input type="date" value={d.bandLaunch} onChange={e => set("bandLaunch", e.target.value)} style={inputStyle} /></Field>
                <Field label="Carnival date"><input type="date" value={d.carnivalDate} onChange={e => set("carnivalDate", e.target.value)} style={inputStyle} /></Field>
              </div>
              <Field label="Other important dates">
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {d.customDates.map((cd, i) => (
                    <div key={i} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      <input value={cd.label} placeholder="Label (e.g. Photoshoot)" onChange={e => {
                        const next = [...d.customDates]; next[i] = { ...next[i], label: e.target.value }; set("customDates", next);
                      }} style={{ ...inputStyle, flex: 1 }} />
                      <input type="date" value={cd.date} onChange={e => {
                        const next = [...d.customDates]; next[i] = { ...next[i], date: e.target.value }; set("customDates", next);
                      }} style={{ ...inputStyle, width: "9rem" }} />
                      <button type="button" onClick={() => set("customDates", d.customDates.filter((_, j) => j !== i))} style={{ background: "#F3F4F6", border: "none", borderRadius: "0.375rem", padding: "0.4rem", cursor: "pointer", display: "flex" }}>
                        <X style={{ width: "0.8rem", height: "0.8rem", color: "#6B7280" }} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => set("customDates", [...d.customDates, { label: "", date: "" }])}
                    style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "none", border: "1px dashed #D1D5DB", borderRadius: "0.375rem", padding: "0.45rem", cursor: "pointer", color: "#6B7280", fontSize: "0.8rem", fontWeight: 600, justifyContent: "center" }}>
                    <Plus style={{ width: "0.85rem", height: "0.85rem" }} /> Add a date
                  </button>
                </div>
              </Field>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginTop: "1.25rem" }}>
          <button type="button" onClick={() => step === 0 ? onClose() : setStep(step - 1)}
            style={{ background: "#F3F4F6", color: "#374151", border: "none", borderRadius: "0.5rem", padding: "0.6rem 1rem", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" }}>
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < 2 ? (
            <button type="button" disabled={!canNext} onClick={() => setStep(step + 1)}
              style={{ background: canNext ? "#7C3AED" : "#C4B5FD", color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.6rem 1.4rem", fontWeight: 700, cursor: canNext ? "pointer" : "not-allowed", fontSize: "0.85rem" }}>
              Next
            </button>
          ) : (
            <button type="button" disabled={saving || !d.sectionName.trim()} onClick={handleSave}
              style={{ background: "#7C3AED", color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.6rem 1.4rem", fontWeight: 700, cursor: saving ? "wait" : "pointer", fontSize: "0.85rem" }}>
              {saving ? "Saving..." : "Save and build plan"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ ...labelStyle, marginBottom: "0.35rem" }}>{label}</div>
      {children}
    </div>
  );
}

function ColorEditor({ colors, onChange }: { colors: SocialColor[]; onChange: (c: SocialColor[]) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
      {colors.map((c, i) => (
        <div key={i} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <input type="color" value={c.hex || "#000000"} onChange={e => { const n = [...colors]; n[i] = { ...n[i], hex: e.target.value }; onChange(n); }}
            style={{ width: "2.4rem", height: "2.2rem", border: "1px solid #E5E7EB", borderRadius: "0.375rem", padding: 0, cursor: "pointer", background: "#fff" }} />
          <input value={c.name} placeholder="Name (e.g. Gold)" onChange={e => { const n = [...colors]; n[i] = { ...n[i], name: e.target.value }; onChange(n); }} style={{ ...inputStyle, flex: 1 }} />
          <input value={c.hex} placeholder="#RRGGBB" onChange={e => { const n = [...colors]; n[i] = { ...n[i], hex: e.target.value }; onChange(n); }} style={{ ...inputStyle, width: "6.5rem", fontFamily: "monospace" }} />
          <button type="button" onClick={() => onChange(colors.filter((_, j) => j !== i))} style={{ background: "#F3F4F6", border: "none", borderRadius: "0.375rem", padding: "0.4rem", cursor: "pointer", display: "flex" }}>
            <X style={{ width: "0.8rem", height: "0.8rem", color: "#6B7280" }} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...colors, { name: "", hex: "#7C3AED" }])}
        style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "none", border: "1px dashed #D1D5DB", borderRadius: "0.375rem", padding: "0.45rem", cursor: "pointer", color: "#6B7280", fontSize: "0.8rem", fontWeight: 600, justifyContent: "center" }}>
        <Plus style={{ width: "0.85rem", height: "0.85rem" }} /> Add color
      </button>
    </div>
  );
}

function enumOpts<T extends string>(labels: Record<T, string>): { value: T; label: string }[] {
  return (Object.keys(labels) as T[]).map(k => ({ value: k, label: labels[k] }));
}

// ── Post card ──────────────────────────────────────────────────────────────────
const CATEGORY_COLOR: Record<string, string> = {
  "Section intro": "#7C3AED", "Registration": "#FF006E", "Costume reveal": "#FF6B35",
  "Models": "#0891B2", "Parent shirts": "#059669", "Engagement": "#1A73E8",
  "Behind the scenes": "#D97706", "Band launch": "#EF4444", "Countdown": "#F59E0B", "Key date": "#6B7280",
};

function PostCard({ post }: { post: PlannedPost }) {
  const [copied, setCopied] = useState(false);
  const color = CATEGORY_COLOR[post.category] ?? "#6B7280";
  const dateLabel = post.date ? post.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "Flexible";

  async function copy() {
    const text = `${post.caption}\n\n${post.hashtags.join(" ")}`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  }

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "0.875rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.6rem", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ width: "0.6rem", height: "0.6rem", borderRadius: "50%", background: color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E2029" }}>{post.title}</div>
          <div style={{ fontSize: "0.68rem", color: "#9CA3AF" }}>{post.category} · {post.timing}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", fontWeight: 700, color }}>
            <CalendarDays style={{ width: "0.8rem", height: "0.8rem" }} /> {dateLabel}
          </div>
        </div>
      </div>
      <div style={{ padding: "0.875rem 1rem" }}>
        <p style={{ fontSize: "0.85rem", color: "#374151", whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.5 }}>{post.caption}</p>
        {post.hashtags.length > 0 && (
          <p style={{ fontSize: "0.78rem", color: "#1A73E8", margin: "0.6rem 0 0", wordBreak: "break-word" }}>{post.hashtags.join(" ")}</p>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.75rem", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.68rem", color: "#9CA3AF" }}>{post.platforms.join(", ")}</span>
          <button onClick={copy}
            style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: copied ? "rgba(5,150,105,0.1)" : "#F3F4F6", color: copied ? "#059669" : "#374151", border: "none", borderRadius: "0.375rem", padding: "0.35rem 0.7rem", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>
            {copied ? <Check style={{ width: "0.8rem", height: "0.8rem" }} /> : <Copy style={{ width: "0.8rem", height: "0.8rem" }} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────────
export default function SocialPage() {
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);

  const reload = useCallback(() => {
    return getSocialProfile(SEASON).then(setProfile).catch(console.error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getSocialProfile(SEASON)
      .then(p => {
        if (cancelled) return;
        setProfile(p);
        if (!p) setWizardOpen(true); // first open pops the setup
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const plan = useMemo(
    () => profile ? buildSocialPlan(profile, Object.values(CostumeTypeLabels)) : [],
    [profile],
  );
  const summary = planSummary(plan);
  const initialDraft: Draft = profile ? profileToDraft(profile) : EMPTY_DRAFT;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "linear-gradient(135deg,#7C3AED,#FF006E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Megaphone style={{ width: "1rem", height: "1rem", color: "#fff" }} />
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>Social Media</h1>
          </div>
          <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: 0 }}>Your brand, strategy, and a ready to post content plan for {SEASON}</p>
        </div>
        {profile && (
          <button onClick={() => setWizardOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#F3F4F6", border: "none", borderRadius: "0.5rem", padding: "0.5rem 0.75rem", cursor: "pointer", color: "#374151", fontWeight: 600, fontSize: "0.82rem", flexShrink: 0 }}>
            <Pencil style={{ width: "0.9rem", height: "0.9rem" }} /> <span className="mas-hide-sm">Edit brand</span>
          </button>
        )}
      </motion.div>
      <style>{`@media (max-width: 480px){ .mas-hide-sm{ display:none; } }`}</style>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", gap: "0.75rem", color: "#9CA3AF" }}>
          <Loader2 style={{ width: "1.25rem", height: "1.25rem" }} className="animate-spin" />
          <span style={{ fontSize: "0.875rem" }}>Loading...</span>
        </div>
      ) : !profile ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "3rem 2rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <Sparkles style={{ width: "2.5rem", height: "2.5rem", color: "#C4B5FD", margin: "0 auto 1rem" }} />
          <p style={{ fontSize: "0.95rem", color: "#374151", fontWeight: 600, margin: "0 0 0.35rem" }}>Let&apos;s set up your social media</p>
          <p style={{ fontSize: "0.82rem", color: "#9CA3AF", margin: "0 0 1.25rem" }}>Answer a few questions and we&apos;ll build your posting plan.</p>
          <button onClick={() => setWizardOpen(true)} style={{ background: "#7C3AED", color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.6rem 1.4rem", fontWeight: 700, cursor: "pointer" }}>Get started</button>
        </div>
      ) : (
        <>
          <ProfileSummary profile={profile} />

          {/* Plan */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0.25rem 0 0.75rem" }}>
              <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#374151", margin: 0 }}>Content plan</h2>
              <span style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>{summary.total} posts · {summary.dated} scheduled</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {plan.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.025, 0.3) }}>
                  <PostCard post={post} />
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}

      <Wizard open={wizardOpen} initial={initialDraft} onClose={() => setWizardOpen(false)} onSaved={reload} />
    </div>
  );
}

function ProfileSummary({ profile }: { profile: SocialProfile }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", flexWrap: "wrap" }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>{profile.sectionName}</h2>
        {profile.slogan && <span style={{ fontSize: "0.85rem", color: "#7C3AED", fontWeight: 600, fontStyle: "italic" }}>{profile.slogan}</span>}
      </div>
      {profile.description && <p style={{ fontSize: "0.85rem", color: "#6B7280", margin: "0.5rem 0 0" }}>{profile.description}</p>}

      {profile.colors.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.85rem" }}>
          {profile.colors.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "#F9FAFB", borderRadius: "999px", padding: "0.2rem 0.6rem 0.2rem 0.2rem" }}>
              <span style={{ width: "1.1rem", height: "1.1rem", borderRadius: "50%", background: c.hex, border: "1px solid rgba(0,0,0,0.1)" }} />
              <span style={{ fontSize: "0.72rem", color: "#374151", fontWeight: 600 }}>{c.name || c.hex}</span>
              <span style={{ fontSize: "0.66rem", color: "#9CA3AF", fontFamily: "monospace" }}>{c.hex}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid #F3F4F6" }}>
        <Meta label="Goals" value={profile.goals.length ? `${profile.goals.length} set` : "None"} />
        <Meta label="Platforms" value={profile.platforms.map(p => SocialPlatformLabels[p]).join(", ") || "None"} />
        <Meta label="Cadence" value={PostingCadenceLabels[profile.cadence]} />
        <Meta label="Tone" value={profile.tones.map(t => BrandToneLabels[t]).join(", ") || "Not set"} />
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF" }}>{label}</div>
      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginTop: "0.15rem" }}>{value}</div>
    </div>
  );
}
