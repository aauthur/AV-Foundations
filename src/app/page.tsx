import React from "react";

export default function HomePage() {
  return (
    <main
      className="container"
      style={{
        padding: "3.5rem 1.5rem 4rem",
      }}
    >
      <header
        style={{
          marginBottom: "2.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2rem",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-block",
              padding: "0.4rem 0.8rem",
              borderRadius: 999,
              background: "rgba(255,248,231,0.14)",
              border: "1.5px solid rgba(255,248,231,0.35)",
              color: "rgba(255,253,247,0.92)",
              fontSize: "0.92rem",
              marginBottom: "1rem",
            }}
          >
            University-level math. Completely free.
          </div>

          <h1
            style={{
              fontSize: "3.25rem",
              lineHeight: 1,
              letterSpacing: "-0.04em",
              margin: "0 0 1rem",
            }}
          >
            Open Math Academy
          </h1>

          <p
            style={{
              fontSize: "1.15rem",
              lineHeight: 1.75,
              color: "var(--muted)",
              maxWidth: 760,
              margin: 0,
            }}
          >
            I love math and have faced many financial barriers in my efforts to
            learn as much as possible about it. University courses are locked
            behind entry requirements and outrageous tuition prices. This website
            is my attempt to create university-level courses that are completely
            free and available to everyone.
          </p>

          <div
            style={{
              marginTop: "1.75rem",
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <a href="/courses" className="btn btnPrimary">
              Browse courses →
            </a>
            <a
              href="https://www.youtube.com/@ProvenMath"
              target="_blank"
              rel="noreferrer"
              className="btn btnGhost"
            >
              YouTube channel →
            </a>
          </div>
        </div>

        <HeroArt />
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1rem",
        }}
      >
        <Card
          title="Complete Courses"
          body="I create full courses with recorded lectures, notes, exercises, and solutions."
        />
        <Card
          title="Serious Math"
          body="Rather than teach you how to solve problems for exams, I aim to give a complete understanding of the subject."
        />
        <Card
          title="Entirely Free"
          body="I make these courses for the love of the game. I will never charge a dime for access."
        />
        <Card
          title="Instant Feedback"
          body="AI-powered grading means you can try more complicated exercises and get immediate feedback."
        />
      </section>
    </main>
  );
}

function HeroArt() {
  return (
    <div
      style={{
        position: "relative",
        background: "var(--paper-soft)",
        border: "3px solid rgba(184,121,85,0.9)",
        borderRadius: 34,
        padding: "1.2rem",
        boxShadow: "0 18px 40px rgba(0,0,0,0.12)",
        transform: "rotate(-1deg)",
      }}
    >
      <CornerDoodle />
      <img
        src="/pfp.png"
        alt="Open Math Academy illustration"
        style={{
          width: "100%",
          maxWidth: 360,
          display: "block",
          margin: "0 auto",
          filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.10))",
        }}
      />

      <div
        style={{
          marginTop: "0.8rem",
          textAlign: "center",
          color: "#8e5b3d",
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        In depth math for free
      </div>
    </div>
  );
}

function CornerDoodle() {
  return (
    <svg
      width="140"
      height="140"
      viewBox="0 0 140 140"
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "-18px",
        right: "-16px",
        opacity: 0.28,
        pointerEvents: "none",
      }}
    >
      <path
        d="M18 32 C 48 0, 106 12, 112 50 C 118 88, 70 102, 54 82 C 40 66, 56 50, 72 54"
        fill="none"
        stroke="#e8ddb1"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="24" cy="104" r="4" fill="#e8ddb1" />
      <circle cx="40" cy="114" r="3" fill="#e8ddb1" />
    </svg>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <h3
        style={{
          marginTop: 0,
          marginBottom: "0.6rem",
          fontSize: "1.1rem",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h3>
      <p style={{ margin: 0, lineHeight: 1.7, color: "var(--muted)" }}>
        {body}
      </p>
    </div>
  );
}