import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AV Foundations",
  description: "Rigorous, proof-first math courses — free and open source.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top navigation */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            backdropFilter: "blur(12px)",
            background: "rgba(11, 15, 25, 0.75)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <nav
            className="container"
            style={{
              padding: "0.75rem 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <a href="/" className="brand">
              AV Foundations
            </a>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <NavLink href="/courses">Courses</NavLink>
              <NavLink href="https://www.youtube.com/@ProvenMath" external>
                YouTube
              </NavLink>
            </div>
          </nav>
        </header>

        {/* Main content */}
        <main style={{ flex: 1 }}>
          {children}
        </main>

        {/* Footer */}
        <footer
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            marginTop: "3rem",
          }}
        >
          <div
            className="container"
            style={{
              padding: "1.5rem 0",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              opacity: 0.7,
            }}
          >
            <small>© {new Date().getFullYear()} AV Foundations</small>
            <small>
              Free, open-source math education. Built with Next.js + MDX.
            </small>
          </div>
        </footer>
      </body>
    </html>
  );
}

function NavLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="navlink"
    >
      {children}
    </a>
  );
}
