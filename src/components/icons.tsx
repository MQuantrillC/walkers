import type { SVGProps } from "react";

// A small set of line icons drawn in the same hand as the walkers: one
// stroke weight, round ends, no fills. They take the text colour and size
// from the surrounding text (1em), so they sit inside buttons and links.
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1.15em"
      height="1.15em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 12.5c4.8-.4 9.6-.4 14.5-.3M14 7.2l5 5-5 4.8" />
  </Icon>
);

export const ArrowLeft = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19.5 12.5c-4.8-.4-9.6-.4-14.5-.3M10 7.2l-5 5 5 4.8" />
  </Icon>
);

// A die showing five: "pick a look at random".
export const Dice = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="4" width="16" height="16" rx="4.5" />
    <g fill="currentColor" stroke="none">
      <circle cx="8.8" cy="8.8" r="1.25" />
      <circle cx="15.2" cy="8.8" r="1.25" />
      <circle cx="12" cy="12" r="1.25" />
      <circle cx="8.8" cy="15.2" r="1.25" />
      <circle cx="15.2" cy="15.2" r="1.25" />
    </g>
  </Icon>
);

export const Restart = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5.5 12a6.5 6.5 0 1 0 2-4.7" />
    <path d="M7.3 3.8v3.7H11" />
  </Icon>
);

export const Pencil = (p: IconProps) => (
  <Icon {...p}>
    <path d="M15.5 5.2l3.3 3.3L8.7 18.6l-4.2.9.9-4.2z" />
    <path d="M13.4 7.3l3.3 3.3" />
  </Icon>
);

export const Trash = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.2h9.2L17.5 7" />
  </Icon>
);

export const Share = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 14.5V4M8 7.8 12 4l4 3.8" />
    <path d="M7.5 10.5H6v9h12v-9h-1.5" />
  </Icon>
);

export const Search = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10.5" cy="10.5" r="5.8" />
    <path d="m15 15 4.8 4.8" />
  </Icon>
);

export const Heart = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 19.5s-7.5-4.3-7.5-9.6A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.5 2.3c0 5.3-7.5 9.6-7.5 9.6Z" />
  </Icon>
);

export const Undo = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 14.5 4.5 10 9 5.5" />
    <path d="M4.5 10h9.2a5.3 5.3 0 0 1 0 10.6H11" />
  </Icon>
);

export const Redo = (p: IconProps) => (
  <Icon {...p}>
    <path d="M15 14.5 19.5 10 15 5.5" />
    <path d="M19.5 10h-9.2a5.3 5.3 0 0 0 0 10.6H13" />
  </Icon>
);

export const Brush = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19.5 4.5 11 13" />
    <path d="M10.8 13.2c-2.4-.6-4.6.9-4.6 3.4 0 1.4-.7 2.4-1.7 2.9 3.5.9 7.6-.7 7.6-4.3z" />
  </Icon>
);

export const Eraser = (p: IconProps) => (
  <Icon {...p}>
    <path d="m13.5 5.2 5.3 5.3-8.3 8.3H7.3l-2.6-2.6a1.6 1.6 0 0 1 0-2.3z" />
    <path d="m9 9.7 5.3 5.3M10.5 18.8h8.5" />
  </Icon>
);

// "Nothing": a circle with a slash, for the empty choice in a list.
export const NoneMark = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="7.5" />
    <path d="m6.8 17.2 10.4-10.4" />
  </Icon>
);

export const Sun = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
  </Icon>
);

export const Moon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19.5 14.6A7.8 7.8 0 1 1 9.4 4.5a6.3 6.3 0 0 0 10.1 10.1Z" />
  </Icon>
);

// The site's mark: one walker mid-stride, drawn in a few lines. Also the
// favicon (src/app/icon.svg) and the wordmark in the header.
export const WalkerMark = (p: IconProps) => (
  <Icon strokeWidth={2.1} {...p}>
    <circle cx="13.6" cy="4.6" r="2.4" fill="currentColor" stroke="none" />
    <path d="M12.9 8.6 11.6 14.2" />
    <path d="M11.6 14.2 8.4 20.4M11.6 14.2l3.3 2.6.4 4" />
    <path d="M12.6 9.6 9.4 12.7M12.6 9.6l2.6 3.3" />
  </Icon>
);
