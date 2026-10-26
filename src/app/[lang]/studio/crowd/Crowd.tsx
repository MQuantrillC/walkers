"use client";

import { useState, useSyncExternalStore } from "react";
import { Walkway } from "@/components/Walkway";
import { randomLook } from "@/creator/Creator";
import { DEFAULT_APPEARANCE } from "@/walker/appearance";

const noSubscribe = () => () => {};

// Random looks differ between server and browser, so the crowd is only
// made in the browser.
export function Crowd() {
  const inBrowser = useSyncExternalStore(noSubscribe, () => true, () => false);
  return inBrowser ? <RandomCrowd /> : null;
}

function RandomCrowd() {
  const [walkers] = useState(() => {
    const n = Math.min(500, Math.max(1, Number(new URLSearchParams(location.search).get("n")) || 20));
    return Array.from({ length: n }, (_, i) => ({
      name: `Walker ${i + 1}`,
      appearance: { ...DEFAULT_APPEARANCE, ...randomLook() },
    }));
  });
  return <Walkway walkers={walkers} />;
}
