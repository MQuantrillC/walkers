import type { WalkerAppearance } from "./appearance";
import { cleanDisplayName, sanitizeAppearance } from "./validate";

// Shapes of walker rows as the app uses them. Appearances are always
// sanitised on the way out of the database, so even a row written around
// the app (straight through the API) can only render with known parts and
// palette colours.

export type WalkerStatus = "draft" | "published" | "hidden";

// Columns a client may read; owner_id is never selectable.
export const MY_WALKER_COLUMNS = "id, display_name, appearance, status, published_at, updated_at";
export const PUBLIC_WALKER_COLUMNS = "id, display_name, appearance, published_at";

export type MyWalker = {
  id: string;
  name: string;
  appearance: WalkerAppearance;
  status: WalkerStatus;
  publishedAt: string | null;
  updatedAt: string;
};

export type PublicWalker = {
  id: string;
  name: string;
  appearance: WalkerAppearance;
  publishedAt: string;
};

type Row = Record<string, unknown>;

function status(v: unknown): WalkerStatus {
  return v === "published" || v === "hidden" ? v : "draft";
}

export function toMyWalker(row: Row): MyWalker {
  return {
    id: String(row.id),
    name: cleanDisplayName(row.display_name),
    appearance: sanitizeAppearance(row.appearance),
    status: status(row.status),
    publishedAt: typeof row.published_at === "string" ? row.published_at : null,
    updatedAt: String(row.updated_at),
  };
}

export function toPublicWalker(row: Row): PublicWalker {
  return {
    id: String(row.id),
    name: cleanDisplayName(row.display_name),
    appearance: sanitizeAppearance(row.appearance),
    publishedAt: String(row.published_at),
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isWalkerId = (v: string) => UUID.test(v);
