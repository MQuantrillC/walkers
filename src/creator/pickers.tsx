"use client";

import type { CSSProperties, ReactNode } from "react";
import { HeadParts, Walker } from "@/walker/Walker";
import { INK, type Swatch, type WalkerAppearance } from "@/walker/appearance";
import { useI18n } from "@/i18n/I18nProvider";
import { NoneMark } from "@/components/icons";
import styles from "./creator.module.css";

function Field({ title, help, children }: { title: string; help?: string; children: ReactNode }) {
  return (
    <fieldset className={styles.field}>
      <legend>{title}</legend>
      {help && <p className={styles.fieldHelp}>{help}</p>}
      <div className={styles.options}>{children}</div>
    </fieldset>
  );
}

export function Choices<T extends string>({
  title,
  options,
  labels,
  value,
  onChange,
  blank,
}: {
  title: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (v: T) => void;
  // The option meaning "nothing", shown as a no-symbol instead of a word.
  blank?: T;
}) {
  return (
    <Field title={title}>
      {options.map((o) =>
        o === blank ? (
          <button
            key={o}
            className={`${styles.chip} ${styles.blank}`}
            aria-pressed={o === value}
            aria-label={labels[o]}
            title={labels[o]}
            onClick={() => onChange(o)}
          >
            <NoneMark />
          </button>
        ) : (
          <button key={o} className={styles.chip} aria-pressed={o === value} onClick={() => onChange(o)}>
            {labels[o]}
          </button>
        ),
      )}
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
  const { t } = useI18n();
  const name = (s: Swatch) => t.colors[s.id as keyof typeof t.colors] ?? s.id;
  const current = swatches.find((s) => s.hex === value);
  return (
    <Field title={current ? `${title} · ${name(current)}` : title}>
      {swatches.map((s) => (
        <button
          key={s.hex}
          className={styles.swatch}
          style={{ background: s.hex }}
          aria-pressed={s.hex === value}
          aria-label={name(s)}
          title={name(s)}
          onClick={() => onChange(s.hex)}
        />
      ))}
    </Field>
  );
}

// Head thumbnails, for options you need to see (hair, hats, glasses).
export function HeadChoices<T extends string>({
  title,
  options,
  labels,
  value,
  onChange,
  preview,
  blank,
}: {
  title: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (v: T) => void;
  preview: (option: T) => WalkerAppearance;
  blank?: T;
}) {
  return (
    <Field title={title}>
      {options.map((o) => (
        <button
          key={o}
          className={styles.thumb}
          aria-pressed={o === value}
          aria-label={labels[o]}
          title={labels[o]}
          onClick={() => onChange(o)}
        >
          {o === blank ? (
            <NoneMark className={styles.blankMark} />
          ) : (
            <>
              <svg viewBox="54 -4 58 58" aria-hidden style={{ color: INK }}>
                <HeadParts a={preview(o)} />
              </svg>
              <span>{labels[o]}</span>
            </>
          )}
        </button>
      ))}
    </Field>
  );
}

// Full-figure toggles for extras that can be combined (gloves, scarf, ...).
// The figures hold still mid-stride so wrists and backs are visible.
export function ToggleChoices<T extends string>({
  title,
  help,
  options,
  labels,
  isOn,
  onToggle,
  preview,
}: {
  title: string;
  help: string;
  options: readonly T[];
  labels: Record<T, string>;
  isOn: (v: T) => boolean;
  onToggle: (v: T) => void;
  preview: (option: T) => WalkerAppearance;
}) {
  return (
    <Field title={title} help={help}>
      {options.map((o) => (
        <button
          key={o}
          className={styles.thumb}
          aria-pressed={isOn(o)}
          title={labels[o]}
          onClick={() => onToggle(o)}
          style={{ "--wk-play": "paused" } as CSSProperties}
        >
          <Walker appearance={preview(o)} height={64} phase={0.55} />
          <span>{labels[o]}</span>
        </button>
      ))}
    </Field>
  );
}
