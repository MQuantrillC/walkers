"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Walker } from "@/walker/Walker";
import { SAMPLE_WALKERS } from "@/walker/samples";
import { GAIT } from "@/walker/gait";
import { VIEWBOX, WALK_DURATION_S } from "@/walker/walkCss";
import { Procession } from "@/components/Procession";
import styles from "./studio.module.css";

const SPEEDS = [
  { label: "Normal", factor: 1 },
  { label: "Slow ×4", factor: 4 },
  { label: "Slow ×10", factor: 10 },
];

const TREADMILL_H = 360;
const SIZES = [48, 96, 160, 240];
const SHEET_FRAMES = 8;
const SHEET_H = 300;

function vars(v: Record<string, string | number>) {
  return v as CSSProperties;
}

export function Studio() {
  const [selected, setSelected] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [phase, setPhase] = useState(0);

  const treadmillRef = useRef<HTMLDivElement>(null);

  // Rewind paused animations to zero so the scrubber shows absolute frames
  // (each frame is then set purely by the --wk-phase delay).
  useEffect(() => {
    if (!paused) return;
    for (const anim of treadmillRef.current?.getAnimations({ subtree: true }) ?? []) {
      anim.currentTime = 0;
    }
  }, [paused, selected, speed]);

  const sample = SAMPLE_WALKERS[selected];
  const duration = WALK_DURATION_S * speed;
  const stridePx = GAIT.stride * (TREADMILL_H / VIEWBOX.height);

  return (
    <div className={styles.studio}>
      <header className={styles.header}>
        <h1>Walk cycle studio</h1>
        <p>Developer view for checking the walk, outfits and sizes.</p>
      </header>

      <section className={styles.treadmillSection}>
        <div
          ref={treadmillRef}
          className={styles.treadmill}
          style={vars({
            "--wk-dur": `${duration}s`,
            "--wk-play": paused ? "paused" : "running",
            "--wk-phase": phase,
            "--stride-px": `${stridePx}px`,
            "--ground-y": `${(TREADMILL_H * (VIEWBOX.height - 210)) / VIEWBOX.height}px`,
          })}
        >
          <div className={styles.ground} />
          <Walker appearance={sample.appearance} height={TREADMILL_H} phase={phase} title={sample.name} />
        </div>

        <div className={styles.controls}>
          <div className={styles.row} role="group" aria-label="Sample walker">
            {SAMPLE_WALKERS.map((w, i) => (
              <button
                key={w.name}
                className={i === selected ? styles.chipOn : styles.chip}
                onClick={() => setSelected(i)}
              >
                {w.name}
              </button>
            ))}
          </div>
          <div className={styles.row} role="group" aria-label="Speed">
            {SPEEDS.map((s) => (
              <button
                key={s.label}
                className={s.factor === speed ? styles.chipOn : styles.chip}
                onClick={() => setSpeed(s.factor)}
              >
                {s.label}
              </button>
            ))}
            <button className={paused ? styles.chipOn : styles.chip} onClick={() => setPaused((p) => !p)}>
              {paused ? "Paused" : "Pause"}
            </button>
          </div>
          <label className={styles.scrub} aria-disabled={!paused}>
            <span>Frame {Math.round(phase * 100)}%</span>
            <input
              type="range"
              min={0}
              max={0.995}
              step={0.005}
              value={phase}
              disabled={!paused}
              onChange={(e) => setPhase(Number(e.target.value))}
            />
          </label>
          <p className={styles.note}>
            The ground scrolls at exactly one stride per cycle, so a planted foot should stay locked to it.
          </p>
        </div>
      </section>

      <section>
        <h2 className={styles.h2}>Contact sheet · one cycle</h2>
        <div className={styles.sheet} style={vars({ "--wk-play": "paused" })}>
          {Array.from({ length: SHEET_FRAMES }, (_, i) => (
            <figure key={i}>
              <Walker appearance={sample.appearance} height={SHEET_H} phase={i / SHEET_FRAMES} />
              <figcaption>{Math.round((i / SHEET_FRAMES) * 100)}%</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section>
        <h2 className={styles.h2}>Sizes</h2>
        <div className={styles.sizes}>
          {SIZES.map((h, i) => (
            <figure key={h}>
              <Walker appearance={sample.appearance} height={h} phase={i * 0.17} />
              <figcaption>{h}px</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section>
        <h2 className={styles.h2}>Procession</h2>
        <Procession walkers={SAMPLE_WALKERS} />
      </section>
    </div>
  );
}
