import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Space_Mono, Syne } from "next/font/google";

const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-space-mono' });
const syne = Syne({ weight: ['400', '800'], subsets: ['latin'], variable: '--font-syne' });

export const metadata: Metadata = {
  title: "COVERGEN — AI 封面生成",
  description: "Neo-brutalist AI cover generator",
};

const nav = [
  { href: "/", label: "仪表盘", icon: "■" },
  { href: "/templates", label: "模板库", icon: "▲" },
  { href: "/resources", label: "资源库", icon: "●" },
  { href: "/generate", label: "生成封面", icon: "★" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className={`${spaceMono.variable} ${syne.variable}`}>
      <body style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <aside style={{
            width: 280, flexShrink: 0, background: "var(--surface)",
            borderRight: "6px solid var(--border)", display: "flex",
            flexDirection: "column", padding: "40px 0", position: "fixed",
            top: 0, left: 0, height: "100vh", zIndex: 10
          }}>
            <div style={{ padding: "0 32px 48px" }}>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: "-1px", lineHeight: 0.9 }}>
                <div style={{ color: "var(--accent)" }}>COVER</div>
                <div style={{ color: "var(--text)" }}>GEN</div>
              </div>
              <div style={{ fontSize: 10, color: "var(--text)", marginTop: 12, textTransform: "uppercase", letterSpacing: "1px" }}>AI GENERATOR</div>
            </div>
            <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              {nav.map(item => (
                <Link key={item.href} href={item.href} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "16px 32px", color: "var(--text)",
                  textDecoration: "none", fontSize: 14, fontWeight: 700,
                  transition: "all 0.2s", textTransform: "uppercase",
                  letterSpacing: "0.5px", position: "relative"
                }}
                  className="nav-link">
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div style={{ padding: "24px 32px", borderTop: "3px solid var(--border)" }}>
              <Link href="/settings" style={{ fontSize: 11, color: "var(--text)", textDecoration: "none", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>
                ⚙ 设置
              </Link>
            </div>
          </aside>
          <main style={{ marginLeft: 280, flex: 1, minHeight: "100vh", background: "var(--bg)" }}>
            {children}
          </main>
        </div>
        <style>{`
          .nav-link:hover {
            background: var(--accent) !important;
            color: var(--text-inv) !important;
          }
          .nav-link::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 0;
            background: var(--accent2);
            transition: width 0.3s;
          }
          .nav-link:hover::before {
            width: 6px;
          }
        `}</style>
      </body>
    </html>
  );
}
