import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "封面生成器",
  description: "B站/YouTube 视频封面 AI 生成工具",
};

const nav = [
  { href: "/", label: "仪表盘", icon: "⊞" },
  { href: "/templates", label: "模板库", icon: "◧" },
  { href: "/resources", label: "资源库", icon: "◈" },
  { href: "/generate", label: "生成封面", icon: "✦" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          {/* Sidebar */}
          <aside style={{
            width: 220, flexShrink: 0, background: "var(--surface)",
            borderRight: "1px solid var(--border)", display: "flex",
            flexDirection: "column", padding: "24px 0", position: "fixed",
            top: 0, left: 0, height: "100vh", zIndex: 10
          }}>
            <div style={{ padding: "0 20px 28px" }}>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px" }}>
                <span style={{ color: "var(--accent)" }}>COVER</span>
                <span style={{ color: "var(--text)" }}>GEN</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>AI 封面生成工具</div>
            </div>
            <nav style={{ flex: 1 }}>
              {nav.map(item => (
                <Link key={item.href} href={item.href} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 20px", color: "var(--muted)",
                  textDecoration: "none", fontSize: 14, fontWeight: 500,
                  transition: "all 0.15s"
                }}
                  className="nav-link">
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
              <Link href="/settings" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>
                ⚙ 设置
              </Link>
            </div>
          </aside>
          {/* Main */}
          <main style={{ marginLeft: 220, flex: 1, minHeight: "100vh", background: "var(--bg)" }}>
            {children}
          </main>
        </div>
        <style>{`
          .nav-link:hover { color: var(--text) !important; background: var(--surface2); }
        `}</style>
      </body>
    </html>
  );
}
