"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[erp] app crashed:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "32rem" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            The app failed to start
          </h1>
          <p style={{ marginBottom: "1rem", color: "#666" }}>
            This is a crash outside a module route, so the error boundary could
            not contain it.
          </p>
          <pre
            style={{
              background: "#f4f4f5",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
              whiteSpace: "pre-wrap",
            }}
          >
            {error.message}
          </pre>
          <button
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#18181b",
              color: "white",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
