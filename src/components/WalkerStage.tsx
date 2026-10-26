import type { CSSProperties } from "react";
import { Walker } from "@/walker/Walker";
import type { WalkerAppearance } from "@/walker/appearance";
import { GAIT } from "@/walker/gait";
import { VIEWBOX } from "@/walker/walkCss";
import styles from "./walkerStage.module.css";

// A single walker on a ground line whose ticks scroll at exactly its
// walking speed, so it reads as walking forward.
export function WalkerStage({ appearance, height, title }: { appearance: WalkerAppearance; height: number; title?: string }) {
  return (
    <div
      className={styles.stage}
      style={
        {
          "--stride-px": `${GAIT.stride * (height / VIEWBOX.height)}px`,
          "--ground-y": `${(height * (VIEWBOX.height - 210)) / VIEWBOX.height}px`,
        } as CSSProperties
      }
    >
      <div className={styles.ground} />
      <Walker appearance={appearance} height={height} title={title} className={styles.walker} />
    </div>
  );
}
