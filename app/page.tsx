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

  return (
    <div style={{ padding: '48px 56px' }}>
      <div style={{ marginBottom: 56, animation: 'slideIn 0.6s ease-out' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 56, fontWeight: 800, letterSpacing: '-2px', margin: 0, color: 'var(--text-inv)', lineHeight: 0.95 }}>
          仪表盘
        </h1>
        <p style={{ color: 'var(--accent2)', marginTop: 12, fontSize: 13, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
          AI COVER GENERATOR
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 48 }}>
        {[
          { label: '模板', value: stats.templates, href: '/templates', bg: '#ff3366' },
          { label: '资源', value: stats.resources, href: '/resources', bg: '#00ff88' },
          { label: '项目', value: stats.projects, href: '/generate', bg: '#ffdd00' },
        ].map((s, i) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none', animation: `slideIn 0.6s ease-out ${0.1 + i * 0.1}s backwards` }}>
            <div style={{
              background: 'var(--surface)', border: '5px solid var(--border)',
              padding: '32px 28px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: `8px 8px 0 ${s.bg}`, position: 'relative', overflow: 'hidden'
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translate(-4px, -4px)';
                e.currentTarget.style.boxShadow = `12px 12px 0 ${s.bg}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translate(0, 0)';
                e.currentTarget.style.boxShadow = `8px 8px 0 ${s.bg}`;
              }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 64, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 12, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>{s.label}</div>
              <div style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, background: s.bg, transform: 'rotate(45deg)' }} />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 48 }}>
        <Link href="/templates" style={{ textDecoration: 'none', animation: 'slideIn 0.6s ease-out 0.4s backwards' }}>
          <div style={{
            background: 'var(--surface)', border: '5px solid var(--border)',
            padding: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20,
            transition: 'all 0.2s', position: 'relative'
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
            <div style={{ width: 56, height: 56, background: '#ff3366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: 'var(--text-inv)' }}>▲</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>上传模板</div>
              <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 6, opacity: 0.7 }}>添加封面模板并 AI 分析元素</div>
            </div>
          </div>
        </Link>
        <Link href="/generate" style={{ textDecoration: 'none', animation: 'slideIn 0.6s ease-out 0.5s backwards' }}>
          <div style={{
            background: '#00ff88', border: '5px solid var(--border)',
            padding: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20,
            transition: 'all 0.2s', position: 'relative'
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
            <div style={{ width: 56, height: 56, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#00ff88' }}>★</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--border)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>生成封面</div>
              <div style={{ fontSize: 11, color: 'var(--border)', marginTop: 6, opacity: 0.7 }}>上传视频或文案，AI 生成封面</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Projects */}
      {projects.length > 0 && (
        <div style={{ animation: 'slideIn 0.6s ease-out 0.6s backwards' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 24, color: 'var(--text-inv)', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>最近项目</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {projects.map((p: Record<string, unknown>) => (
              <Link key={p.id as number} href={`/generate?project=${p.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--surface)', border: '4px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '20px 24px', transition: 'all 0.2s', position: 'relative'
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.borderLeftWidth = '12px';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.borderLeftWidth = '4px';
                  }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{(p.title as string) || '无标题'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 6, opacity: 0.6 }}>
                      {p.cover_count as number} 个封面 · {new Date(p.created_at as string).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, padding: '6px 16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
                    background: p.status === 'done' ? '#00ff88' : p.status === 'processing' ? '#ffdd00' : '#ff3366',
                    color: 'var(--border)', border: '3px solid var(--border)'
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
