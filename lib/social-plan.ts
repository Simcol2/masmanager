// ─── Social Content Planner ─────────────────────────────────────────────────────
// Turns a SocialProfile (brand + strategy + key dates) into a dated posting
// schedule with draft captions, hashtags, and platform hints. Pure and
// deterministic: same profile in, same plan out. The caption templates are
// tone-aware so the voice matches what the user chose. Swap `draftCaption` for an
// AI call later without touching the scheduling logic.

import type {
  SocialProfile, BrandTone, TargetAudience, SocialPlatform,
} from "@/types";
import { SocialPlatformLabels } from "@/types";

export interface PlannedPost {
  id: string;
  date?: Date;        // undefined = flexible, post anytime
  timing: string;     // human label for when
  category: string;
  title: string;      // short internal label
  caption: string;
  hashtags: string[];
  platforms: string[];
}

// ── Voice helpers ────────────────────────────────────────────────────────────────
const TONE_EMOJI: Record<BrandTone, string> = {
  fun: "🎉", bold: "🔥", elegant: "✨", cultural: "🥁", family: "💛", hype: "🚨",
};

function primaryTone(p: SocialProfile): BrandTone {
  return p.tones[0] ?? "fun";
}
function emoji(p: SocialProfile): string {
  return p.tones.map(t => TONE_EMOJI[t]).slice(0, 2).join("") || "✨";
}

function audiencePhrase(audiences: TargetAudience[]): string {
  if (audiences.includes("toddler_parents") || audiences.includes("kids_parents")) return "your little masquerader";
  if (audiences.includes("whole_family")) return "the whole family";
  if (audiences.includes("teens") || audiences.includes("young_adults")) return "you";
  return "your masquerader";
}

function ctaOpen(tone: BrandTone): string {
  switch (tone) {
    case "bold": return "Registration is OPEN. Don't sleep on this.";
    case "hype": return "IT'S TIME. Registration is officially OPEN.";
    case "elegant": return "Registration is now open.";
    case "cultural": return "The road calls. Registration is open.";
    case "family": return "Registration is open, come play with us.";
    default: return "Registration is OPEN.";
  }
}

// ── Hashtags ─────────────────────────────────────────────────────────────────────
function seasonYear(p: SocialProfile): string {
  return p.carnivalDate ? String(p.carnivalDate.getFullYear()) : "2026";
}
function baseHashtags(p: SocialProfile): string[] {
  const tag = p.sectionName.replace(/[^a-zA-Z0-9]/g, "");
  const year = seasonYear(p);
  const tags = [`#${tag}`, `#Carnival${year}`, "#PlayMas", "#Mas", "#TrinidadCarnival"];
  return Array.from(new Set(tags.filter(t => t.length > 1)));
}

function platformHints(p: SocialProfile): string[] {
  const labels = p.platforms.map(pl => SocialPlatformLabels[pl as SocialPlatform]);
  return labels.length ? labels : ["Instagram"];
}

// ── Date helpers ─────────────────────────────────────────────────────────────────
function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

// How many countdown checkpoints to place before a big date, by cadence.
function countdownOffsets(p: SocialProfile): number[] {
  switch (p.cadence) {
    case "daily": return [30, 21, 14, 10, 7, 5, 3, 1];
    case "few_weekly": return [30, 14, 7, 3, 1];
    case "weekly": return [28, 14, 7, 1];
    case "few_monthly": return [30, 7];
  }
}

// ── Caption builder ──────────────────────────────────────────────────────────────
function sign(p: SocialProfile): string {
  const e = emoji(p);
  return p.slogan ? `${p.slogan} ${e}` : e;
}

// ── The plan ─────────────────────────────────────────────────────────────────────
export function buildSocialPlan(p: SocialProfile, costumeStyles: string[] = []): PlannedPost[] {
  const tone = primaryTone(p);
  const e = emoji(p);
  const who = audiencePhrase(p.audiences);
  const tags = baseHashtags(p);
  const plats = platformHints(p);
  const posts: PlannedPost[] = [];
  let seq = 0;
  const add = (post: Omit<PlannedPost, "id" | "hashtags" | "platforms"> & { hashtags?: string[] }) => {
    posts.push({
      id: `p${seq++}`,
      hashtags: post.hashtags ?? tags,
      platforms: plats,
      ...post,
    });
  };

  // Intro / section reveal (flexible, post first)
  add({
    timing: "Kickoff post",
    category: "Section intro",
    title: "Meet the section",
    caption: `Meet ${p.sectionName} ${e}\n${p.description ? p.description + "\n" : ""}${p.slogan ? p.slogan + "\n" : ""}Follow along as we build something special for Carnival ${seasonYear(p)}.`,
  });

  // Registration open + teaser
  if (p.registrationOpen) {
    add({
      date: addDays(p.registrationOpen, -7),
      timing: "1 week before registration opens",
      category: "Registration",
      title: "Registration opens soon",
      caption: `Save the date ${e}\nRegistration for ${p.sectionName} opens ${fmt(p.registrationOpen)}. Spots are limited, get ready to secure yours for ${who}.\n${sign(p)}`,
    });
    add({
      date: p.registrationOpen,
      timing: "Registration opens",
      category: "Registration",
      title: "Registration is open",
      caption: `${ctaOpen(tone)} ${e}\nSecure your costume for ${p.sectionName} now. Link in bio to register ${who}.\n${sign(p)}`,
    });
  } else {
    add({
      timing: "When registration opens",
      category: "Registration",
      title: "Registration is open",
      caption: `${ctaOpen(tone)} ${e}\nSecure your costume for ${p.sectionName}. Link in bio to register.\n${sign(p)}`,
    });
  }

  // Costume reveals, spaced between open and launch (or flexible)
  const revealStart = p.registrationOpen ?? undefined;
  const revealEnd = p.bandLaunch ?? p.carnivalDate ?? undefined;
  const styles = costumeStyles.length ? costumeStyles : ["Our costume"];
  styles.forEach((style, i) => {
    let date: Date | undefined;
    if (revealStart && revealEnd) {
      const span = Math.max(1, daysBetween(revealStart, revealEnd));
      date = addDays(revealStart, Math.round((span * (i + 1)) / (styles.length + 1)));
    }
    add({
      date,
      timing: date ? "Costume reveal" : "Reveal (flexible)",
      category: "Costume reveal",
      title: `Reveal: ${style}`,
      caption: `Costume reveal ${e}\nPresenting ${style} for ${p.sectionName}. ${toneRevealLine(tone)}\nRegister now to make it yours.\n${sign(p)}`,
    });
  });

  // Goal-driven posts
  if (p.goals.includes("showcase_models")) {
    add({
      timing: "Model feature (flexible)",
      category: "Models",
      title: "Model showcase",
      caption: `Meet our models ${e}\nSee ${p.sectionName} come to life on the road. Tag someone who needs to be in this section.\n${sign(p)}`,
    });
  }
  if (p.goals.includes("sell_shirts")) {
    add({
      timing: "Parent shirt promo (flexible)",
      category: "Parent shirts",
      title: "Parent shirts",
      caption: `Rep the section from the sidelines ${e}\nParent shirts for ${p.sectionName} are available now. Grab yours before we close orders.\n${sign(p)}`,
    });
  }
  if (p.goals.includes("grow_followers")) {
    add({
      timing: "Engagement post (flexible)",
      category: "Engagement",
      title: "Giveaway / engagement",
      caption: `Let's grow the family ${e}\nFollow ${p.sectionName}, tag two friends, and share to your story for a chance to win. Winner announced soon.\n${sign(p)}`,
    });
  }
  if (p.goals.includes("build_hype")) {
    add({
      timing: "Behind the scenes (flexible)",
      category: "Behind the scenes",
      title: "Behind the scenes",
      caption: `Behind the scenes ${e}\nEvery gem, every stitch. This is the work going into ${p.sectionName} for Carnival ${seasonYear(p)}.\n${sign(p)}`,
    });
  }

  // Registration closing
  if (p.registrationClose) {
    add({
      date: addDays(p.registrationClose, -3),
      timing: "3 days before registration closes",
      category: "Registration",
      title: "Closing soon",
      caption: `Almost gone ${e}\nRegistration for ${p.sectionName} closes ${fmt(p.registrationClose)}. Last few spots, don't miss the road.\n${sign(p)}`,
    });
    add({
      date: p.registrationClose,
      timing: "Registration closes",
      category: "Registration",
      title: "Last chance",
      caption: `Final call ${e}\nToday is the last day to register for ${p.sectionName}. Secure your spot before we close.\n${sign(p)}`,
    });
  }

  // Band launch
  if (p.bandLaunch) {
    add({
      date: addDays(p.bandLaunch, -7),
      timing: "1 week before band launch",
      category: "Band launch",
      title: "Launch countdown",
      caption: `One week to launch ${e}\n${p.sectionName} is almost ready to reveal everything. Band launch ${fmt(p.bandLaunch)}. You do not want to miss this.\n${sign(p)}`,
    });
    add({
      date: p.bandLaunch,
      timing: "Band launch day",
      category: "Band launch",
      title: "Launch day",
      caption: `Launch day is here ${e}\nThis is ${p.sectionName} for Carnival ${seasonYear(p)}. ${p.slogan ?? "Come play with us."}\n${sign(p)}`,
    });
  }

  // Carnival countdown
  if (p.carnivalDate) {
    for (const off of countdownOffsets(p)) {
      const date = addDays(p.carnivalDate, -off);
      add({
        date,
        timing: `${off} days to Carnival`,
        category: "Countdown",
        title: `${off} days to go`,
        caption: `${off} days to Carnival ${e}\nThe road is calling ${p.sectionName}. Are you ready?\n${sign(p)}`,
      });
    }
  }

  // Custom dates
  for (const cd of p.customDates) {
    add({
      date: cd.date,
      timing: cd.label,
      category: "Key date",
      title: cd.label,
      caption: `${cd.label} ${e}\nMark your calendar. More from ${p.sectionName} coming your way.\n${sign(p)}`,
    });
  }

  // Sort: dated first (chronological), flexible posts after
  posts.sort((a, b) => {
    if (a.date && b.date) return a.date.getTime() - b.date.getTime();
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });
  return posts;
}

function toneRevealLine(tone: BrandTone): string {
  switch (tone) {
    case "bold": return "Bold, loud, unforgettable.";
    case "elegant": return "Every detail, refined.";
    case "cultural": return "Rooted in the culture, made for the road.";
    case "family": return "Made with love for our masqueraders.";
    case "hype": return "This one is going to break the internet.";
    default: return "We cannot wait for you to see it in person.";
  }
}

function fmt(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

// Quick summary counts for the header.
export function planSummary(posts: PlannedPost[]) {
  const dated = posts.filter(p => p.date).length;
  return { total: posts.length, dated, flexible: posts.length - dated };
}
