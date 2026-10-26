import { Fragment, isValidElement, type ReactElement, type ReactNode } from "react";

// Renders a tree of plain SVG elements and hook-free components (like
// <Walker frame={...}>) to an SVG string, for places where React DOM's
// server renderer isn't available, such as generated share images.

// SVG attributes that keep their camelCase spelling.
const CAMEL = new Set(["viewBox", "preserveAspectRatio", "clipPathUnits", "gradientUnits", "patternUnits"]);
const SKIP = new Set(["children", "key", "ref"]);

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function attribute(name: string, value: unknown): string {
  if (value === undefined || value === null || value === false || SKIP.has(name)) return "";
  if (typeof value === "function") return "";
  if (name === "className") return ` class="${escape(String(value))}"`;
  if (name === "style" && typeof value === "object") {
    const css = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k.startsWith("--") ? k : kebab(k)}:${String(v)}`)
      .join(";");
    return css ? ` style="${escape(css)}"` : "";
  }
  const attr = CAMEL.has(name) || name.includes("-") ? name : kebab(name);
  return ` ${attr}="${escape(value === true ? "" : String(value))}"`;
}

export function renderSvg(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return escape(String(node));
  if (Array.isArray(node)) return node.map(renderSvg).join("");
  if (!isValidElement(node)) return "";

  const el = node as ReactElement<Record<string, unknown>>;
  const { type, props } = el;
  if (type === Fragment) return renderSvg(props.children as ReactNode);
  if (typeof type === "function") {
    return renderSvg((type as (p: Record<string, unknown>) => ReactNode)(props));
  }
  if (typeof type !== "string") return "";
  const attrs = Object.entries(props)
    .map(([k, v]) => attribute(k, v))
    .join("");
  const inner = renderSvg(props.children as ReactNode);
  return inner ? `<${type}${attrs}>${inner}</${type}>` : `<${type}${attrs}/>`;
}
