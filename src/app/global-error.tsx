"use client";

// Last resort when even the layout fails: no theme, fonts or dictionaries,
// so it says it in both languages.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f2f0eb",
          color: "#1f1e1c",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: 32, margin: "0 0 12px" }}>Algo tropezó · Something tripped</h1>
          <button
            onClick={() => retry()}
            style={{ font: "inherit", padding: "10px 20px", borderRadius: 999, border: 0, background: "#1f1e1c", color: "#f2f0eb", cursor: "pointer" }}
          >
            Reintentar · Try again
          </button>
        </div>
      </body>
    </html>
  );
}
