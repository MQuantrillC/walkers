"use client";

import { useState, useSyncExternalStore } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { reportWalker, type ReportReason } from "@/walker/moderation";
import styles from "./reportButton.module.css";

// Walkers this device has already reported, so the button doesn't invite
// the same report twice (the database also allows one per signed-in person).
const KEY = "walkers:reported";
const noSubscribe = () => () => {};

function reportedIds(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function remember(id: string) {
  try {
    const ids = new Set(reportedIds().split(",").filter(Boolean));
    ids.add(id);
    window.localStorage.setItem(KEY, [...ids].slice(-200).join(","));
  } catch {
    // Storage unavailable: nothing to remember.
  }
}

export function ReportButton({ walkerId }: { walkerId: string }) {
  const { t } = useI18n();
  const alreadyReported = useSyncExternalStore(noSubscribe, () => reportedIds().split(",").includes(walkerId), () => false);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  if (state === "sent" || alreadyReported) return <p className={styles.note}>{t.report.thanks}</p>;

  if (!open) {
    return (
      <button className={styles.link} onClick={() => setOpen(true)}>
        {t.report.button}
      </button>
    );
  }

  async function send() {
    if (!reason) return;
    setState("sending");
    const res = await reportWalker({ walkerId, reason, details }).catch(() => ({ ok: false }));
    if (res.ok) {
      remember(walkerId);
      setState("sent");
    } else {
      setState("failed");
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <fieldset>
        <legend>{t.report.title}</legend>
        {(["name", "drawing", "other"] as const).map((r) => (
          <label key={r} className={styles.option}>
            <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
            {t.report.reasons[r]}
          </label>
        ))}
      </fieldset>
      <textarea
        value={details}
        maxLength={500}
        rows={3}
        placeholder={t.report.details}
        aria-label={t.report.details}
        onChange={(e) => setDetails(e.target.value)}
      />
      {state === "failed" && <p className={styles.error}>{t.report.failed}</p>}
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={() => setOpen(false)}>
          {t.report.cancel}
        </button>
        <button type="submit" className={styles.primary} disabled={!reason || state === "sending"}>
          {t.report.send}
        </button>
      </div>
    </form>
  );
}
