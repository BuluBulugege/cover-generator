'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState({ templates: 0, resources: 0, projects: 0 });
  const [projects, setProjects] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/templates').then(r => r.json()),
      fetch('/api/resources').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
    ]).then(([t, r, p]) => {
      setStats({ templates: t.length, resources: r.length, projects: p.length });
      setProjects(p.slice(0, 5));
    });
  }, []);

  const S = { padding: '28px 32px' };
  const card = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '20px 24px'
  };

  return (
    <div style={S}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>仪表盘</h1>
        <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 14 }}>欢迎使用 AI 封面生成工具</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: '模板', value: stats.templates, href: '/templates', color: '#f97316' },
          { label: '资源', value: stats.resources, href: '/resources', color: '#06b6d4' },
          { label: '项目', value: stats.projects, href: '/generate', color: '#a855f7' },
        ].map(s => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
            <div style={{ ...card, cursor: 'pointer' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <Link href="/templates" style={{ textDecoration: 'none' }}>
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f9731620', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>◧</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>上传模板</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>添加封面模板并 AI 分析元素</div>
            </div>
          </div>
        </Link>
        <Link href="/generate" style={{ textDecoration: 'none' }}>
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', border: '1px solid var(--accent)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f9731630', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✦</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>生成封面</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>上传视频或文案，AI 生成封面</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent projects */}
      {projects.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>最近项目</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {projects.map((p: Record<string, unknown>) => (
              <Link key={p.id as number} href={`/generate?project=${p.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{(p.title as string) || '无标题'}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {p.cover_count as number} 个封面 · {new Date(p.created_at as string).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 20,
                    background: p.status === 'done' ? '#16a34a20' : p.status === 'processing' ? '#f9731620' : '#71717a20',
                    color: p.status === 'done' ? '#16a34a' : p.status === 'processing' ? '#f97316' : '#71717a'
                  }}>{p.status === 'done' ? '完成' : p.status === 'processing' ? '处理中' : '待处理'}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
