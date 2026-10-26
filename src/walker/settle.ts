import type { ActionResult } from "./actions";

// A server action throws instead of answering when the network drops or a
// new deploy has replaced it. This turns that into the ordinary "failed"
// result, so the screen shows an error rather than staying busy forever.
export async function settle<T>(call: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await call();
  } catch {
    return { ok: false, error: "failed" };
  }
}
