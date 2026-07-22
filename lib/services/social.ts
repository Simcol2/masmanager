import {
  doc, getDoc, setDoc, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SocialProfile } from "@/types";

// One social profile per season, stored at socialProfiles/{seasonId}.

function fromFirestore(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  for (const key of ["createdAt", "updatedAt", "registrationOpen", "registrationClose", "bandLaunch", "carnivalDate"]) {
    if (out[key] instanceof Timestamp) out[key] = (out[key] as Timestamp).toDate();
  }
  if (Array.isArray(out.customDates)) {
    out.customDates = (out.customDates as Record<string, unknown>[]).map(d => ({
      ...d,
      date: d.date instanceof Timestamp ? d.date.toDate() : d.date,
    }));
  }
  return out;
}

function toFirestore(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === undefined ? null : v]),
  );
}

export async function getSocialProfile(seasonId: string): Promise<SocialProfile | null> {
  const snap = await getDoc(doc(db, "socialProfiles", seasonId));
  if (!snap.exists()) return null;
  return fromFirestore({ id: snap.id, ...snap.data() }) as SocialProfile;
}

export async function saveSocialProfile(
  seasonId: string,
  data: Omit<SocialProfile, "id" | "createdAt" | "updatedAt">,
): Promise<void> {
  const ref = doc(db, "socialProfiles", seasonId);
  const existing = await getDoc(ref);
  await setDoc(ref, {
    ...toFirestore(data as Record<string, unknown>),
    seasonId,
    createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
