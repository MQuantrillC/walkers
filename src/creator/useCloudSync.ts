"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { getMyWalker, saveWalker, setPublished, type ActionError } from "@/walker/actions";
import type { MyWalker } from "@/walker/records";
import type { WalkerAppearance } from "@/walker/appearance";
import { cleanDisplayName } from "@/walker/validate";
import { EMPTY_DRAFT, type Draft } from "./draft";
import { settle } from "@/walker/settle";

const snapshot = (name: string, appearance: WalkerAppearance) =>
  JSON.stringify([cleanDisplayName(name), appearance]);

export type CloudSync = {
  // undefined while loading (or signed out); null when nothing is saved yet.
  remote: MyWalker | null | undefined;
  dirty: boolean;
  busy: boolean;
  error: ActionError | null;
  notice: "loadedSaved" | "keptLocal" | "published" | null;
  save: (publish?: boolean) => Promise<boolean>;
  unpublish: () => Promise<void>;
};

// Keeps the on-device draft and the account's saved walker in step.
// After sign-in, whichever was changed more recently wins: an untouched
// device loads the saved walker; newer local edits are kept as unsaved.
export function useCloudSync(
  initial: Draft,
  current: { name: string; appearance: WalkerAppearance },
  load: (walker: MyWalker) => void,
): CloudSync {
  const { auth } = useAuth();
  const [remote, setRemote] = useState<MyWalker | null | undefined>(undefined);
  const [synced, setSynced] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ActionError | null>(null);
  const [notice, setNotice] = useState<CloudSync["notice"]>(null);

  const signedIn = auth.status === "signedIn";

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    settle(getMyWalker).then((res) => {
      if (cancelled) return;
      if (!res.ok) return setError(res.error);
      const w = res.data;
      setRemote(w);
      if (!w) return;
      const blank = snapshot(initial.name, initial.appearance) === snapshot(EMPTY_DRAFT.name, EMPTY_DRAFT.appearance);
      if (blank || (initial.updatedAt ?? 0) <= Date.parse(w.updatedAt)) {
        load(w);
        setNotice("loadedSaved");
      } else {
        setNotice("keptLocal");
      }
      setSynced(snapshot(w.name, w.appearance));
    });
    return () => {
      cancelled = true;
    };
    // Only when the signed-in state changes: the draft that came from this
    // device (`initial`) is what gets compared, not later edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const now = snapshot(current.name, current.appearance);

  async function save(publish = false) {
    setBusy(true);
    setError(null);
    const res = await settle(() => saveWalker({ name: current.name, appearance: current.appearance, publish }));
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return false;
    }
    setRemote(res.data);
    setSynced(now);
    setNotice(publish ? "published" : null);
    return true;
  }

  async function unpublish() {
    setBusy(true);
    setError(null);
    const res = await settle(() => setPublished(false));
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setRemote(res.data);
    setNotice(null);
  }

  return {
    remote: signedIn ? remote : undefined,
    dirty: remote === null || (synced !== null && synced !== now),
    busy,
    error,
    notice,
    save,
    unpublish,
  };
}
