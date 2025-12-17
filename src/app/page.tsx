export default function HomePage() {
  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "3.5rem 1.5rem" }}>
      <header style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center", padding: "0.4rem 0.7rem", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "rgba(124,58,237,0.9)" }} />
          <small style={{ opacity: 0.75 }}>Proof-first • Free • Open-source</small>
        </div>

        <h1 style={{ fontSize: "3rem", letterSpacing: "-0.03em", margin: "1rem 0 0.75rem" }}>
          AV Foundations
        </h1>

        <p style={{ fontSize: "1.15rem", lineHeight: 1.7, opacity: 0.78, maxWidth: 780 }}>
          Rigorous, derivation-driven courses that accompany my YouTube videos.
          Built like a curriculum — not a playlist.
        </p>

        <div style={{ marginTop: "1.75rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <a href="/courses" style={button("primary")}>Browse courses →</a>
          <a href="https://www.youtube.com/@ProvenMath" target="_blank" rel="noreferrer" style={button("ghost")}>
            YouTube channel →
          </a>
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
        <Card title="Course-based structure" body="Real Analysis, Probability, Math Stats, and more — organized like a real sequence." />
        <Card title="Serious math" body="Proofs, derivations, and first principles. No vibes-only explanations." />
        <Card title="Built to evolve" body="Quizzes, autograding, typed submissions, and AI-assisted feedback can come later." />
      </section>

      <section style={{ marginTop: "2rem", padding: "1.25rem", borderRadius: 16, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Start here</h2>
        <p style={{ margin: "0.5rem 0 0", opacity: 0.75, lineHeight: 1.7 }}>
          If you’re new, begin with <b>Real Analysis</b> Lesson 1: Limits (epsilon–delta).
          Then follow the lesson list like a textbook.
        </p>
        <div style={{ marginTop: "0.9rem" }}>
          <a href="/courses/real-analysis" style={button("secondary")}>Go to Real Analysis →</a>
        </div>
      </section>

      <footer style={{ marginTop: "3rem", opacity: 0.6 }}>
        <small>Built with Next.js + MDX. Content lives in Git and is easy for collaborators to edit.</small>
      </footer>
    </main>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.05)",
      borderRadius: 18,
      padding: "1.25rem",
      boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
    }}>
      <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>{title}</h3>
      <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.78 }}>{body}</p>
    </div>
  );
}

function button(variant: "primary" | "secondary" | "ghost"): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.8rem 1.05rem",
    borderRadius: 12,
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
  };

  if (variant === "primary") return { ...base, background: "rgba(124,58,237,0.35)", border: "1px solid rgba(124,58,237,0.55)" };
  if (variant === "secondary") return { ...base, background: "rgba(34,197,94,0.22)", border: "1px solid rgba(34,197,94,0.42)" };
  return { ...base, opacity: 0.9 };
}
