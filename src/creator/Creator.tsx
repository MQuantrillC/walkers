"use client";

import { useEffect, useReducer, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Walker } from "@/walker/Walker";
import { Procession } from "@/components/Procession";
import { SAMPLE_WALKERS } from "@/walker/samples";
import { GAIT } from "@/walker/gait";
import { VIEWBOX } from "@/walker/walkCss";
import {
  ACCESSORIES,
  BOTTOM_STYLES,
  BROW_STYLES,
  EYE_STYLES,
  FACE_LIMITS,
  HAIR_STYLES,
  MOUTH_STYLES,
  NAME_MAX,
  PALETTE,
  SHOE_STYLES,
  TOP_STYLES,
  type Face,
  type FaceStroke,
  type WalkerAppearance,
} from "@/walker/appearance";
import { cleanDisplayName } from "@/walker/validate";
import { EMPTY_DRAFT, clearDraft, parseDraft, readDraftRaw, writeDraft, type Draft } from "./draft";
import { FaceEditor } from "./FaceEditor";
import { Choices, HeadChoices, Swatches } from "./pickers";
import styles from "./creator.module.css";

const STEPS = [
  { id: "you", label: "You" },
  { id: "clothes", label: "Clothes" },
  { id: "extras", label: "Extras" },
  { id: "face", label: "Face" },
  { id: "preview", label: "Preview" },
] as const;
type StepId = (typeof STEPS)[number]["id"];

const HISTORY_LIMIT = 100;

type State = Draft & { past: FaceStroke[][]; future: FaceStroke[][] };

type Action =
  | { type: "name"; name: string }
  | { type: "look"; patch: Partial<Omit<WalkerAppearance, "face">> }
  | { type: "face"; patch: Partial<Omit<Face, "strokes">> }
  | { type: "strokes"; strokes: FaceStroke[] }
  | { type: "addStroke"; stroke: FaceStroke }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset" };

function withStrokes(a: WalkerAppearance, strokes: FaceStroke[]): WalkerAppearance {
  return { ...a, face: { ...a.face, strokes } };
}

// Undo and redo cover the face drawing, where mistakes are hardest to fix by hand.
function reducer(state: State, action: Action): State {
  const strokes = state.appearance.face.strokes;
  switch (action.type) {
    case "name":
      return { ...state, name: action.name };
    case "look":
      return { ...state, appearance: { ...state.appearance, ...action.patch } };
    case "face":
      return { ...state, appearance: { ...state.appearance, face: { ...state.appearance.face, ...action.patch } } };
    case "strokes":
      return {
        ...state,
        appearance: withStrokes(state.appearance, action.strokes),
        past: [...state.past, strokes].slice(-HISTORY_LIMIT),
        future: [],
      };
    case "addStroke":
      // Appends to the latest strokes, so quick successive strokes never
      // overwrite each other. Limits are enforced here as a backstop.
      if (strokes.length >= FACE_LIMITS.strokes) return state;
      return reducer(state, { type: "strokes", strokes: [...strokes, action.stroke] });
    case "undo": {
      if (!state.past.length) return state;
      return {
        ...state,
        appearance: withStrokes(state.appearance, state.past[state.past.length - 1]),
        past: state.past.slice(0, -1),
        future: [strokes, ...state.future],
      };
    }
    case "redo": {
      if (!state.future.length) return state;
      return {
        ...state,
        appearance: withStrokes(state.appearance, state.future[0]),
        past: [...state.past, strokes],
        future: state.future.slice(1),
      };
    }
    case "reset":
      return { ...EMPTY_DRAFT, past: [], future: [] };
  }
}

const pickAny = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

function randomLook(): Partial<Omit<WalkerAppearance, "face">> {
  const cloth = PALETTE.cloth.map((c) => c.hex);
  return {
    skin: pickAny(PALETTE.skin).hex,
    hair: pickAny(HAIR_STYLES),
    hairColor: pickAny(PALETTE.hair).hex,
    top: pickAny(TOP_STYLES),
    topColor: pickAny(cloth),
    bottom: pickAny(BOTTOM_STYLES),
    bottomColor: pickAny(cloth),
    shoes: pickAny(SHOE_STYLES),
    shoeColor: pickAny(cloth),
    accessory: Math.random() < 0.6 ? "none" : pickAny(ACCESSORIES),
    accessoryColor: pickAny(cloth),
  };
}

const PREVIEW_H = 290;
const noSubscribe = () => () => {};

// Reads the saved draft once storage is available. On the server (and the
// first hydration pass) there is no draft yet, so the editor waits a beat
// rather than flashing the default walker and then swapping it.
export function CreatorPage() {
  const raw = useSyncExternalStore(noSubscribe, readDraftRaw, () => undefined);
  if (raw === undefined) return <div className={styles.loading} aria-busy="true" />;
  return <Creator initial={parseDraft(raw)} />;
}

function Creator({ initial }: { initial: Draft }) {
  const [state, dispatch] = useReducer(reducer, { ...initial, past: [], future: [] });
  const [step, setStep] = useState<StepId>("you");
  const [saved, setSaved] = useState<boolean | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const { appearance: a, name } = state;
  const displayName = cleanDisplayName(name) || "Your walker";

  // Autosave the draft on this device whenever it changes.
  useEffect(() => {
    const ok = writeDraft({ name, appearance: a });
    // Only report storage trouble; success is the quiet default.
    if (!ok) queueMicrotask(() => setSaved(false));
  }, [name, a]);

  // Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z (or Ctrl+Y) while painting the face.
  useEffect(() => {
    if (step !== "face") return;
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

  const index = STEPS.findIndex((s) => s.id === step);
  const look = (patch: Extract<Action, { type: "look" }>["patch"]) => dispatch({ type: "look", patch });
  const face = (patch: Extract<Action, { type: "face" }>["patch"]) => dispatch({ type: "face", patch });
  const stridePx = GAIT.stride * (PREVIEW_H / VIEWBOX.height);

  return (
    <div className={styles.creator}>
      <section className={styles.preview} aria-label="Live preview">
        <div
          className={styles.stage}
          style={
            {
              "--stride-px": `${stridePx}px`,
              "--ground-y": `${(PREVIEW_H * (VIEWBOX.height - 210)) / VIEWBOX.height}px`,
            } as CSSProperties
          }
        >
          <div className={styles.ground} />
          <Walker appearance={a} height={PREVIEW_H} title={`${displayName}, walking`} className={styles.previewWalker} />
        </div>
        <p className={styles.previewName}>{displayName}</p>
        <div className={styles.previewActions}>
          <button className={styles.chip} onClick={() => look(randomLook())}>
            Randomise look
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
            {confirmReset ? "Tap again to start over" : "Start over"}
          </button>
        </div>
        <p className={styles.saveNote}>
          {saved === false
            ? "This browser won't let us save a draft, so keep this tab open."
            : "Your draft is saved on this device."}
        </p>
      </section>

      <section className={styles.panel}>
        <nav className={styles.steps} aria-label="Creator steps">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              className={styles.step}
              aria-current={s.id === step ? "step" : undefined}
              onClick={() => setStep(s.id)}
            >
              <span>{i + 1}</span>
              {s.label}
            </button>
          ))}
        </nav>

        <div className={styles.stepBody}>
          {step === "you" && (
            <>
              <label className={styles.nameField}>
                <span>Display name</span>
                <input
                  value={name}
                  maxLength={NAME_MAX}
                  placeholder="Give your walker a name"
                  autoComplete="off"
                  onChange={(e) => dispatch({ type: "name", name: e.target.value })}
                />
                <small>
                  Shown with your walker in the public gallery. {NAME_MAX - name.length}{" "}
                  {NAME_MAX - name.length === 1 ? "character" : "characters"} left.
                </small>
              </label>
              <Swatches title="Skin" swatches={PALETTE.skin} value={a.skin} onChange={(skin) => look({ skin })} />
              <HeadChoices
                title="Hair"
                options={HAIR_STYLES}
                value={a.hair}
                onChange={(hair) => look({ hair })}
                preview={(hair) => ({ ...a, hair, accessory: "none" })}
              />
              <Swatches
                title="Hair colour"
                swatches={PALETTE.hair}
                value={a.hairColor}
                onChange={(hairColor) => look({ hairColor })}
              />
            </>
          )}

          {step === "clothes" && (
            <>
              <Choices title="Top" options={TOP_STYLES} value={a.top} onChange={(top) => look({ top })} />
              <Swatches title="Top colour" swatches={PALETTE.cloth} value={a.topColor} onChange={(topColor) => look({ topColor })} />
              <Choices title="Bottoms" options={BOTTOM_STYLES} value={a.bottom} onChange={(bottom) => look({ bottom })} />
              <Swatches
                title="Bottoms colour"
                swatches={PALETTE.cloth}
                value={a.bottomColor}
                onChange={(bottomColor) => look({ bottomColor })}
              />
              <Choices title="Shoes" options={SHOE_STYLES} value={a.shoes} onChange={(shoes) => look({ shoes })} />
              <Swatches title="Shoe colour" swatches={PALETTE.cloth} value={a.shoeColor} onChange={(shoeColor) => look({ shoeColor })} />
            </>
          )}

          {step === "extras" && (
            <>
              <HeadChoices
                title="Accessory"
                options={ACCESSORIES}
                value={a.accessory}
                onChange={(accessory) => look({ accessory })}
                preview={(accessory) => ({ ...a, accessory })}
              />
              {a.accessory !== "none" && (
                <Swatches
                  title="Accessory colour"
                  swatches={PALETTE.cloth}
                  value={a.accessoryColor}
                  onChange={(accessoryColor) => look({ accessoryColor })}
                />
              )}
            </>
          )}

          {step === "face" && (
            <>
              <div className={styles.featureGrid}>
                <Choices title="Eyes" options={EYE_STYLES} value={a.face.eyes} onChange={(eyes) => face({ eyes })} />
                <Choices title="Brows" options={BROW_STYLES} value={a.face.brows} onChange={(brows) => face({ brows })} />
                <Choices title="Mouth" options={MOUTH_STYLES} value={a.face.mouth} onChange={(mouth) => face({ mouth })} />
                <Choices
                  title="Blush"
                  options={["off", "on"] as const}
                  value={a.face.blush ? "on" : "off"}
                  onChange={(v) => face({ blush: v === "on" })}
                />
              </div>
              <FaceEditor
                appearance={a}
                onAdd={(stroke) => dispatch({ type: "addStroke", stroke })}
                onReplace={(strokes) => dispatch({ type: "strokes", strokes })}
                onUndo={() => dispatch({ type: "undo" })}
                onRedo={() => dispatch({ type: "redo" })}
                canUndo={state.past.length > 0}
                canRedo={state.future.length > 0}
              />
            </>
          )}

          {step === "preview" && (
            <div className={styles.finale}>
              <h2>{displayName} is ready to walk.</h2>
              <p>
                This is how your walker looks in the procession. Signing in and publishing to the public
                gallery come next.
              </p>
            </div>
          )}
        </div>

        <div className={styles.stepNav}>
          <button className={styles.chip} disabled={index === 0} onClick={() => setStep(STEPS[index - 1].id)}>
            Back
          </button>
          {index < STEPS.length - 1 && (
            <button className={styles.primary} onClick={() => setStep(STEPS[index + 1].id)}>
              {step === "face" ? (a.face.strokes.length ? "Preview" : "Skip drawing") : "Next"}
            </button>
          )}
        </div>
      </section>

      {step === "preview" && (
        <section className={styles.processionPreview} aria-label="Your walker in the procession">
          <Procession
            walkers={[{ name: displayName, appearance: a }, ...SAMPLE_WALKERS.slice(0, 5)]}
            height={170}
          />
        </section>
      )}
    </div>
  );
}

