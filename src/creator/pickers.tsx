"use client";

import type { ReactNode } from "react";
import { HeadParts } from "@/walker/Walker";
import type { Swatch, WalkerAppearance } from "@/walker/appearance";
import styles from "./creator.module.css";

const LABELS: Record<string, string> = {
  tee: "T-shirt",
  longsleeve: "Long sleeve",
  tank: "Tank top",
  none: "None",
};

export function label(value: string) {
  return LABELS[value] ?? value[0].toUpperCase() + value.slice(1);
}

function Field({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className={styles.field}>
      <legend>{title}</legend>
      <div className={styles.options}>{children}</div>
    </fieldset>
  );
}

export function Choices<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <Field title={title}>
      {options.map((o) => (
        <button key={o} className={styles.chip} aria-pressed={o === value} onClick={() => onChange(o)}>
          {label(o)}
        </button>
      ))}
    </Field>
  );
}

export function Swatches({
  title,
  swatches,
  value,
  onChange,
}: {
  title: string;
  swatches: readonly Swatch[];
  value: string;
  onChange: (hex: string) => void;
}) {
  const current = swatches.find((s) => s.hex === value);
  return (
    <Field title={current ? `${title} · ${current.name}` : title}>
      {swatches.map((s) => (
        <button
          key={s.hex}
          className={styles.swatch}
          style={{ background: s.hex }}
          aria-pressed={s.hex === value}
          aria-label={s.name}
          title={s.name}
          onClick={() => onChange(s.hex)}
        />
      ))}
    </Field>
  );
}

// Head-and-shoulders thumbnails, for options you need to see (hair, hats).
export function HeadChoices<T extends string>({
  title,
  options,
  value,
  onChange,
  preview,
}: {
  title: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  preview: (option: T) => WalkerAppearance;
}) {
  return (
    <Field title={title}>
      {options.map((o) => (
        <button
          key={o}
          className={styles.thumb}
          aria-pressed={o === value}
          aria-label={label(o)}
          title={label(o)}
          onClick={() => onChange(o)}
        >
          <svg viewBox="54 -4 58 58" aria-hidden>
            <HeadParts a={preview(o)} />
          </svg>
          <span>{label(o)}</span>
        </button>
      ))}
    </Field>
  );
}
