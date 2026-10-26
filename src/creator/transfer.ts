import { parseDraft, type Draft } from "./draft";

// Carries a draft between browsers in the URL fragment (after "#", which is
// never sent to any server), so switching from Instagram's built-in browser
// to Safari or Chrome doesn't lose a half-made walker. Compressed where the
// browser supports it; drawings compress well.

export const DRAFT_HASH = "#d=";

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// A real draft is well under these; anything bigger is refused rather than
// unpacked (a tiny compressed link could otherwise expand to gigabytes).
const MAX_LINK_CHARS = 200_000;
const MAX_JSON_BYTES = 256_000;

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

// Decompresses, giving up as soon as the output passes MAX_JSON_BYTES.
async function inflate(bytes: Uint8Array): Promise<Uint8Array | null> {
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_JSON_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

export async function encodeDraft(draft: Draft): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify({ name: draft.name, appearance: draft.appearance }));
  if (typeof CompressionStream === "function") {
    return `z${toBase64Url(await pipe(json, new CompressionStream("deflate-raw")))}`;
  }
  return `j${toBase64Url(json)}`;
}

// Returns null for anything that isn't a valid encoded draft; the result is
// sanitised like any stored draft.
export async function decodeDraft(text: string): Promise<Draft | null> {
  try {
    if (text.length > MAX_LINK_CHARS) return null;
    const bytes = fromBase64Url(text.slice(1));
    let json: Uint8Array | null;
    if (text[0] === "z") json = await inflate(bytes);
    else if (text[0] === "j") json = bytes;
    else return null;
    if (!json || json.length > MAX_JSON_BYTES) return null;
    return parseDraft(new TextDecoder().decode(json));
  } catch {
    return null;
  }
}
