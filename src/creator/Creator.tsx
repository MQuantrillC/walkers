"use client";

import { useEffect, useReducer, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import Link from "next/link";
import { Walker } from "@/walker/Walker";
import { Procession } from "@/components/Procession";
import { GAIT } from "@/walker/gait";
import { VIEWBOX } from "@/walker/walkCss";
import {
  BOTTOM_STYLES,
  BROW_STYLES,
  EXTRAS,
  EYEWEAR,
  EYE_STYLES,
  FACIAL_HAIR,
  HAIR_STYLES,
  HEADWEAR,
  MOUTH_STYLES,
  NAME_MAX,
  PAINT_LIMITS,
  PALETTE,
  SHOE_STYLES,
  SURFACES,
  TOP_STYLES,
  type Extra,
  type Face,
  type Stroke,
  type Surface,
  type WalkerAppearance,
} from "@/walker/appearance";
import { cleanDisplayName } from "@/walker/validate";
import { listLatestWalkers } from "@/walker/actions";
import type { PublicWalker } from "@/walker/records";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { isInAppBrowser } from "@/lib/inAppBrowser";
import { useUserAgent } from "@/auth/SignInButton";
import { DRAFT_HASH, decodeDraft, encodeDraft } from "./transfer";
import { useI18n } from "@/i18n/I18nProvider";
import { EMPTY_DRAFT, clearDraft, parseDraft, readDraftRaw, writeDraft, type Draft } from "./draft";
import { PaintEditor } from "./PaintEditor";
import { SavePanel } from "./SavePanel";
import { useCloudSync } from "./useCloudSync";
import { Choices, HeadChoices, Swatches, ToggleChoices } from "./pickers";
import { ArrowLeft, ArrowRight, Dice, Restart } from "@/components/icons";
import styles from "./creator.module.css";

const STEPS = ["you", "clothes", "extras", "paint", "preview"] as const;
type StepId = (typeof STEPS)[number];

const HISTORY_LIMIT = 100;

// Undo and redo cover painting, where mistakes are hardest to fix by hand.
// Each entry remembers which surface it touched so undo can show it.
type HistoryEntry = { surface: Surface; strokes: Stroke[] };
// `focus` is the surface being painted; undo and redo switch to whichever
// surface they change.
type State = Draft & { past: HistoryEntry[]; future: HistoryEntry[]; focus: Surface };

type Look = Partial<Omit<WalkerAppearance, "face" | "paint" | "extras">>;

type Action =
  | { type: "name"; name: string }
  | { type: "look"; patch: Look }
  | { type: "face"; patch: Partial<Face> }
  | { type: "extra"; id: Extra; color: string | null }
  | { type: "strokes"; surface: Surface; strokes: Stroke[] }
  | { type: "addStroke"; surface: Surface; stroke: Stroke }
  | { type: "focus"; surface: Surface }
  | { type: "load"; name: string; appearance: WalkerAppearance }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset" };

function withStrokes(a: WalkerAppearance, surface: Surface, strokes: Stroke[]): WalkerAppearance {
  return { ...a, paint: { ...a.paint, [surface]: strokes } };
}

function reducer(state: State, action: Action): State {
  const a = state.appearance;
  switch (action.type) {
    case "name":
      return { ...state, name: action.name };
    case "look":
      return { ...state, appearance: { ...a, ...action.patch } };
    case "face":
      return { ...state, appearance: { ...a, face: { ...a.face, ...action.patch } } };
    case "focus":
      return { ...state, focus: action.surface };
    case "load":
      // A saved walker replaces the draft; painting history starts afresh.
      return { ...state, name: action.name, appearance: action.appearance, past: [], future: [] };
    case "extra": {
      const extras = { ...a.extras };
      if (action.color) extras[action.id] = action.color;
      else delete extras[action.id];
      return { ...state, appearance: { ...a, extras } };
    }
    case "strokes":
      return {
        ...state,
        appearance: withStrokes(a, action.surface, action.strokes),
        past: [...state.past, { surface: action.surface, strokes: a.paint[action.surface] }].slice(-HISTORY_LIMIT),
        future: [],
      };
    case "addStroke": {
      // Appends to the latest strokes, so quick successive strokes never
      // overwrite each other. Limits are enforced here as a backstop.
      const current = a.paint[action.surface];
      if (current.length >= PAINT_LIMITS.strokesPerSurface) return state;
      return reducer(state, { type: "strokes", surface: action.surface, strokes: [...current, action.stroke] });
    }
    case "undo": {
      const entry = state.past[state.past.length - 1];
      if (!entry) return state;
      return {
        ...state,
        appearance: withStrokes(a, entry.surface, entry.strokes),
        focus: entry.surface,
        past: state.past.slice(0, -1),
        future: [{ surface: entry.surface, strokes: a.paint[entry.surface] }, ...state.future],
      };
    }
    case "redo": {
      const entry = state.future[0];
      if (!entry) return state;
      return {
        ...state,
        appearance: withStrokes(a, entry.surface, entry.strokes),
        focus: entry.surface,
        past: [...state.past, { surface: entry.surface, strokes: a.paint[entry.surface] }],
        future: state.future.slice(1),
      };
    }
    case "reset":
      return { ...EMPTY_DRAFT, past: [], future: [], focus: "face" };
  }
}

const cloth = Object.fromEntries(PALETTE.cloth.map((c) => [c.id, c.hex])) as Record<string, string>;

// Sensible first colour when an extra is switched on.
const EXTRA_DEFAULT_COLOR: Record<Extra, string> = {
  bracelet: cloth.ochre,
  watch: cloth.black,
  gloves: cloth.black,
  scarf: cloth.red,
  necklace: cloth.ochre,
  backpack: cloth.blue,
};

const pickAny = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];
const sometimes = <T,>(chance: number, list: readonly T[], otherwise: T) =>
  Math.random() < chance ? pickAny(list) : otherwise;

export function randomLook(): Look & { extras: WalkerAppearance["extras"] } {
  const hexes = PALETTE.cloth.map((c) => c.hex);
  const extras: WalkerAppearance["extras"] = {};
  for (const id of EXTRAS) if (Math.random() < 0.18) extras[id] = pickAny(hexes);
  return {
    skin: pickAny(PALETTE.skin).hex,
    hair: pickAny(HAIR_STYLES),
    hairColor: pickAny(PALETTE.hair.slice(0, 7)).hex,
    facialHair: sometimes(0.25, FACIAL_HAIR, "none"),
    top: pickAny(TOP_STYLES),
    topColor: pickAny(hexes),
    bottom: pickAny(BOTTOM_STYLES),
    bottomColor: pickAny(hexes),
    shoes: pickAny(SHOE_STYLES),
    shoeColor: pickAny(hexes),
    headwear: sometimes(0.3, HEADWEAR, "none"),
    headwearColor: pickAny(hexes),
    eyewear: sometimes(0.25, EYEWEAR, "none"),
    eyewearColor: pickAny(hexes),
    extras,
  };
}

// Walker height in the live preview; smaller on phones, where the preview
// stays pinned above the options.
const PREVIEW_H = { wide: 290, compact: 170 };
const noSubscribe = () => () => {};

// Reads the saved draft once storage is available. On the server (and the
// first hydration pass) there is no draft yet, so the editor waits a beat
// rather than flashing the default walker and then swapping it.
//
// A draft can also arrive in the URL fragment, carried over from another
// browser (see transfer.ts); it is saved on this device and then used.
export function CreatorPage() {
  const raw = useSyncExternalStore(noSubscribe, readDraftRaw, () => undefined);
  const carried = useSyncExternalStore(noSubscribe, readCarriedDraft, () => null);
  const [imported, setImported] = useState<Draft | null | undefined>(undefined);

  useEffect(() => {
    if (!carried) return;
    decodeDraft(carried).then((draft) => {
      if (draft) writeDraft({ ...draft, updatedAt: Date.now() });
      const { pathname, search } = window.location;
      window.history.replaceState(window.history.state, "", `${pathname}${search}`);
      setImported(draft);
    });
  }, [carried]);

  if (raw === undefined || (carried && imported === undefined)) {
    return <div className={styles.loading} aria-busy="true" />;
  }
  return <Creator initial={imported ?? parseDraft(raw)} />;
}

function readCarriedDraft() {
  return window.location.hash.startsWith(DRAFT_HASH) ? window.location.hash.slice(DRAFT_HASH.length) : null;
}

function Creator({ initial }: { initial: Draft }) {
  const { t, locale } = useI18n();
  const [state, dispatch] = useReducer(reducer, { ...initial, past: [], future: [], focus: "face" });
  const [step, setStep] = useState<StepId>("you");
  const [saved, setSaved] = useState<boolean | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const { appearance: a, name, focus: surface } = state;
  const displayName = cleanDisplayName(name) || t.creator.defaultName;
  const o = t.options;

  const sync = useCloudSync(initial, { name, appearance: a }, (w) =>
    dispatch({ type: "load", name: w.name, appearance: w.appearance }),
  );

  // Autosave the draft on this device whenever it changes (not on first
  // render, so opening the page doesn't count as an edit).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const ok = writeDraft({ name, appearance: a, updatedAt: Date.now() });
    // Only report storage trouble; success is the quiet default.
    if (!ok) queueMicrotask(() => setSaved(false));
  }, [name, a]);

  // Inside Instagram & co., keep the draft in the URL fragment too, so
  // "open in browser" carries it to Safari/Chrome where sign-in works.
  const inApp = isInAppBrowser(useUserAgent());
  useEffect(() => {
    if (!inApp) return;
    const timer = setTimeout(() => {
      encodeDraft({ name, appearance: a }).then((code) => {
        const { pathname, search } = window.location;
        window.history.replaceState(window.history.state, "", `${pathname}${search}${DRAFT_HASH}${code}`);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [inApp, name, a]);

  // Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z (or Ctrl+Y) while painting.
  useEffect(() => {
    if (step !== "paint") return;
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof Element && e.target.closest("input, textarea")) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) dispatch({ type: "undo" });
      else if ((key === "z" && e.shiftKey) || key === "y") dispatch({ type: "redo" });
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  // Others already walking, shown beside the new walker on the last step.
  const [others, setOthers] = useState<PublicWalker[]>([]);
  useEffect(() => {
    if (step !== "preview") return;
    let cancelled = false;
    listLatestWalkers().then((list) => {
      if (!cancelled) setOthers(list);
    });
    return () => {
      cancelled = true;
    };
  }, [step]);

  const compact = useMediaQuery("(max-width: 800px)");
  const previewH = compact ? PREVIEW_H.compact : PREVIEW_H.wide;
  const index = STEPS.indexOf(step);
  const look = (patch: Look) => dispatch({ type: "look", patch });
  const face = (patch: Partial<Face>) => dispatch({ type: "face", patch });
  const stridePx = GAIT.stride * (previewH / VIEWBOX.height);
  const worn = EXTRAS.filter((id) => a.extras[id]);

  return (
    <div className={styles.creator}>
      <section className={styles.preview} aria-label={t.creator.previewLabel}>
        <div
          className={`${styles.stage} paper`}
          style={
            {
              "--stride-px": `${stridePx}px`,
              "--ground-y": `${(previewH * (VIEWBOX.height - 210)) / VIEWBOX.height}px`,
            } as CSSProperties
          }
        >
          <div className={styles.ground} />
          <Walker
            appearance={a}
            height={previewH}
            title={t.creator.walking(displayName)}
            className={styles.previewWalker}
          />
        </div>
        <p className={styles.previewName}>{displayName}</p>
        <div className={`${styles.previewActions} ${styles.lookActions}`}>
          <button className={styles.chip} onClick={() => look(randomLook())}>
            <Dice />
            {t.creator.randomise}
          </button>
          <button
            className={styles.chip}
            data-danger={confirmReset || undefined}
            onClick={() => {
              if (!confirmReset) return setConfirmReset(true);
              clearDraft();
              dispatch({ type: "reset" });
              setStep("you");
              setConfirmReset(false);
            }}
            onBlur={() => setConfirmReset(false)}
          >
            <Restart />
            {confirmReset ? t.creator.confirmStartOver : t.creator.startOver}
          </button>
        </div>
        {saved === false && <p className={styles.saveError}>{t.creator.draftUnavailable}</p>}
        {step !== "preview" && (
          <div className={styles.saveArea}>
            <SavePanel sync={sync} onPublished={() => setStep("preview")} />
          </div>
        )}
      </section>

      <section className={styles.panel}>
        <nav className={styles.steps} aria-label={t.creator.stepsLabel}>
          {STEPS.map((s, i) => (
            <button
              key={s}
              className={styles.step}
              aria-current={s === step ? "step" : undefined}
              onClick={() => setStep(s)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {t.creator.steps[s]}
            </button>
          ))}
        </nav>

        <div className={styles.stepBody}>
          {step === "you" && (
            <>
              <label className={styles.nameField}>
                <span>{t.creator.name}</span>
                <input
                  value={name}
                  maxLength={NAME_MAX}
                  placeholder={t.creator.namePlaceholder}
                  autoComplete="off"
                  lang={locale}
                  onChange={(e) => dispatch({ type: "name", name: e.target.value })}
                />
                <small>{t.creator.nameHelp(NAME_MAX - name.length)}</small>
              </label>
              <Swatches title={t.creator.skin} swatches={PALETTE.skin} value={a.skin} onChange={(skin) => look({ skin })} />
              <HeadChoices
                title={t.creator.hair}
                options={HAIR_STYLES}
                labels={o.hair}
                value={a.hair}
                onChange={(hair) => look({ hair })}
                preview={(hair) => ({ ...a, hair, headwear: "none", eyewear: "none" })}
              />
              <Swatches
                title={t.creator.hairColor}
                swatches={PALETTE.hair}
                value={a.hairColor}
                onChange={(hairColor) => look({ hairColor })}
              />
              <HeadChoices
                title={t.creator.facialHair}
                options={FACIAL_HAIR}
                labels={o.facialHair}
                value={a.facialHair}
                onChange={(facialHair) => look({ facialHair })}
                blank="none"
                preview={(facialHair) => ({ ...a, facialHair, eyewear: "none" })}
              />
            </>
          )}

          {step === "clothes" && (
            <>
              <Choices title={t.creator.top} options={TOP_STYLES} labels={o.top} value={a.top} onChange={(top) => look({ top })} />
              <Swatches title={t.creator.topColor} swatches={PALETTE.cloth} value={a.topColor} onChange={(topColor) => look({ topColor })} />
              <Choices
                title={t.creator.bottom}
                options={BOTTOM_STYLES}
                labels={o.bottom}
                value={a.bottom}
                onChange={(bottom) => look({ bottom })}
              />
              <Swatches
                title={t.creator.bottomColor}
                swatches={PALETTE.cloth}
                value={a.bottomColor}
                onChange={(bottomColor) => look({ bottomColor })}
              />
              <Choices title={t.creator.shoes} options={SHOE_STYLES} labels={o.shoes} value={a.shoes} onChange={(shoes) => look({ shoes })} />
              <Swatches
                title={t.creator.shoeColor}
                swatches={PALETTE.cloth}
                value={a.shoeColor}
                onChange={(shoeColor) => look({ shoeColor })}
              />
            </>
          )}

          {step === "extras" && (
            <>
              <HeadChoices
                title={t.creator.headwear}
                options={HEADWEAR}
                labels={o.headwear}
                value={a.headwear}
                onChange={(headwear) => look({ headwear })}
                blank="none"
                preview={(headwear) => ({ ...a, headwear })}
              />
              {a.headwear !== "none" && (
                <Swatches
                  title={t.creator.headwearColor}
                  swatches={PALETTE.cloth}
                  value={a.headwearColor}
                  onChange={(headwearColor) => look({ headwearColor })}
                />
              )}
              <HeadChoices
                title={t.creator.eyewear}
                options={EYEWEAR}
                labels={o.eyewear}
                value={a.eyewear}
                onChange={(eyewear) => look({ eyewear })}
                blank="none"
                preview={(eyewear) => ({ ...a, eyewear })}
              />
              {a.eyewear !== "none" && (
                <Swatches
                  title={t.creator.eyewearColor}
                  swatches={PALETTE.cloth}
                  value={a.eyewearColor}
                  onChange={(eyewearColor) => look({ eyewearColor })}
                />
              )}
              <ToggleChoices
                title={t.creator.extras}
                help={t.creator.extrasHelp}
                options={EXTRAS}
                labels={o.extras}
                isOn={(id) => Boolean(a.extras[id])}
                onToggle={(id) =>
                  dispatch({ type: "extra", id, color: a.extras[id] ? null : EXTRA_DEFAULT_COLOR[id] })
                }
                preview={(id) => ({
                  ...a,
                  extras: { ...a.extras, [id]: a.extras[id] ?? EXTRA_DEFAULT_COLOR[id] },
                })}
              />
              {worn.map((id) => (
                <Swatches
                  key={id}
                  title={t.creator.extraColor(o.extras[id])}
                  swatches={PALETTE.cloth}
                  value={a.extras[id]!}
                  onChange={(color) => dispatch({ type: "extra", id, color })}
                />
              ))}
            </>
          )}

          {step === "paint" && (
            <>
              <div className={styles.surfaceTabs} role="group" aria-label={t.creator.paintWhat}>
                {SURFACES.map((s) => (
                  <button key={s} className={styles.chip} aria-pressed={s === surface} onClick={() => dispatch({ type: "focus", surface: s })}>
                    {t.paint.surfaces[s]}
                    {a.paint[s].length > 0 && <span className={styles.dot} aria-hidden />}
                  </button>
                ))}
              </div>
              {surface === "face" && (
                <div className={styles.featureGrid}>
                  <Choices title={t.creator.eyes} options={EYE_STYLES} labels={o.eyes} value={a.face.eyes} onChange={(eyes) => face({ eyes })} blank="none" />
                  <Choices title={t.creator.brows} options={BROW_STYLES} labels={o.brows} value={a.face.brows} onChange={(brows) => face({ brows })} blank="none" />
                  <Choices title={t.creator.mouth} options={MOUTH_STYLES} labels={o.mouth} value={a.face.mouth} onChange={(mouth) => face({ mouth })} blank="none" />
                  <Choices
                    title={t.creator.blush}
                    options={["off", "on"] as const}
                    labels={{ off: t.creator.off, on: t.creator.on }}
                    value={a.face.blush ? "on" : "off"}
                    onChange={(v) => face({ blush: v === "on" })}
                  />
                </div>
              )}
              <PaintEditor
                appearance={a}
                surface={surface}
                onAdd={(s, stroke) => dispatch({ type: "addStroke", surface: s, stroke })}
                onReplace={(s, strokes) => dispatch({ type: "strokes", surface: s, strokes })}
                onUndo={() => dispatch({ type: "undo" })}
                onRedo={() => dispatch({ type: "redo" })}
                canUndo={state.past.length > 0}
                canRedo={state.future.length > 0}
              />
            </>
          )}

          {step === "preview" && (
            // The last step: your walker among those already walking, with
            // the publish controls right here instead of under the preview.
            <div className={styles.finale}>
              <h2>
                {sync.notice === "published" && sync.remote
                  ? t.save.publishedTitle(displayName)
                  : t.creator.readyTitle(displayName)}
              </h2>
              {!(sync.notice === "published" && sync.remote) && <p>{t.creator.readyBody}</p>}
              <div className={styles.finaleWalk} aria-label={t.creator.processionLabel}>
                <Procession
                  walkers={[
                    { name: displayName, appearance: a },
                    ...others
                      .filter((w) => w.id !== sync.remote?.id)
                      .map((w) => ({ name: w.name, appearance: w.appearance, href: `/${locale}/w/${w.id}` })),
                  ]}
                  height={compact ? 120 : 140}
                />
              </div>
              <SavePanel sync={sync} onPublished={() => setStep("preview")} />
              {sync.remote?.status === "published" && (
                <Link className={styles.saveLink} href={`/${locale}`}>
                  {t.creator.seeTheWalk}
                  <ArrowRight />
                </Link>
              )}
            </div>
          )}
        </div>

        <div className={styles.stepNav}>
          <button className={styles.chip} disabled={index === 0} onClick={() => setStep(STEPS[index - 1])}>
            <ArrowLeft />
            {t.creator.back}
          </button>
          {index < STEPS.length - 1 && (
            <button className={styles.primary} onClick={() => setStep(STEPS[index + 1])}>
              {step === "paint" ? t.creator.steps.preview : t.creator.next}
              <ArrowRight />
            </button>
          )}
        </div>
      </section>

    </div>
  );
}
