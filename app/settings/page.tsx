'use client';
import { useState, useEffect } from 'react';

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px' };
const input = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14 };
const btn = { padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#000', cursor: 'pointer', fontSize: 14, fontWeight: 600 };

const FIELDS = [
  { key: 'AI_BASE_URL', label: 'API Base URL', placeholder: 'https://generativelanguage.googleapis.com/v1beta/openai' },
  { key: 'AI_API_KEY', label: 'API Key', placeholder: 'your-api-key', type: 'password' },
  { key: 'ANALYSIS_MODEL', label: '分析模型', placeholder: 'gemini-2.5-flash-preview-05-20' },
  { key: 'VISION_MODEL', label: '视觉模型（视频帧分析）', placeholder: 'gemini-2.0-flash' },
  { key: 'VIDEO_SCRIPT_MODEL', label: '视频转文案模型', placeholder: 'gemini-2.5-flash-preview-05-20' },
  { key: 'IMAGE_GEN_MODEL', label: '图像生成模型', placeholder: 'gemini-3-image-pro' },
];

export default function SettingsPage() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setVals).catch(() => {});
  }, []);

  const save = async () => {
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vals) });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 600 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>设置</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>配置 AI 模型凭证</p>
      <div style={card}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {FIELDS.map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input type={f.type || 'text'} value={vals[f.key] || ''} onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder} style={input as React.CSSProperties} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={btn} onClick={save}>保存设置</button>
          {saved && <span style={{ color: '#16a34a', fontSize: 14 }}>✓ 已保存</span>}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 16 }}>
          设置保存在 .env.local 文件中，重启服务后生效。
        </p>
      </div>
    </div>
  );
}
