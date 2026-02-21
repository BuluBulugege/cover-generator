'use client';
import { useEffect, useState, useRef } from 'react';

type Template = { id: number; name: string; platform: string; image_path: string; elements: Element[]; created_at: string };
type Element = { type: string; description: string; constraints: string; position: string; required: boolean };

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 };
const btn = (accent = false) => ({
  padding: '8px 16px', borderRadius: 8, border: accent ? 'none' : '1px solid var(--border)',
  background: accent ? 'var(--accent)' : 'transparent', color: accent ? '#000' : 'var(--text)',
  cursor: 'pointer', fontSize: 13, fontWeight: 600
});

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ name: '' });
  const [chatInput, setChatInput] = useState('');
  const [chatting, setChatting] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role:'user'|'ai', text:string}[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const load = () => fetch('/api/templates').then(r => r.json()).then(setTemplates);
  useEffect(() => { load(); }, []);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !form.name) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('name', form.name); fd.append('image', file);
    await fetch('/api/templates', { method: 'POST', body: fd });
    setUploading(false); setShowUpload(false); setForm({ name: '' });
    load();
  };

  const analyze = async (id: number) => {
    setAnalyzing(true);
    const res = await fetch(`/api/templates/${id}/analyze`, { method: 'POST' });
    const data = await res.json();
    setSelected(prev => prev ? { ...prev, elements: data.elements } : prev);
    setAnalyzing(false);
    load();
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !selected || chatting) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatHistory(h => [...h, { role: 'user', text: msg }]);
    setChatting(true);
    const res = await fetch(`/api/templates/${selected.id}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, elements: selected.elements }),
    });
    const data = await res.json();
    setSelected(prev => prev ? { ...prev, elements: data.elements } : prev);
    setChatHistory(h => [...h, { role: 'ai', text: data.reply }]);
    setChatting(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    load();
  };

  const del = async (id: number) => {
    if (!confirm('确认删除？')) return;
    await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    setSelected(null); load();
  };

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>模板库</h1>
          <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 14 }}>上传封面模板，AI 自动分析元素约束</p>
        </div>
        <button style={btn(true)} onClick={() => setShowUpload(true)}>+ 上传模板</button>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ ...card, padding: 28, width: 420 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>上传模板</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="模板名称" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14 }} />
              <input ref={fileRef} type="file" accept="image/*"
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14 }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button style={btn()} onClick={() => setShowUpload(false)}>取消</button>
              <button style={btn(true)} onClick={upload} disabled={uploading}>{uploading ? '上传中...' : '上传'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, alignContent: 'start' }}>
          {templates.map(t => (
            <div key={t.id} onClick={() => setSelected(t)} style={{
              ...card, cursor: 'pointer', overflow: 'hidden',
              outline: selected?.id === t.id ? '2px solid var(--accent)' : 'none'
            }}>
              <div style={{ aspectRatio: t.platform === 'bilibili' ? '4/3' : '16/9', overflow: 'hidden', background: '#000' }}>
                <img src={t.image_path} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.elements?.length || 0} 元素</div>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
              暂无模板，点击右上角上传
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ ...card, padding: 20, height: 'fit-content', position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{selected.name}</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <img src={selected.image_path} alt={selected.name} style={{ width: '100%', borderRadius: 8, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button style={{ ...btn(true), flex: 1 }} onClick={() => analyze(selected.id)} disabled={analyzing}>
                {analyzing ? '分析中...' : '✦ AI 分析元素'}
              </button>
              <button style={{ ...btn(), color: '#ef4444', borderColor: '#ef444440' }} onClick={() => del(selected.id)}>删除</button>
            </div>
            {selected.elements?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--muted)' }}>元素约束</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selected.elements.map((el, i) => (
                    <div key={i} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--border)', color: 'var(--muted)' }}>{el.type}</span>
                        {el.required && <span style={{ fontSize: 10, color: '#f97316' }}>必需</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>{el.description}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{el.constraints}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Chat */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--muted)' }}>AI 对话编辑</div>
              {chatHistory.length > 0 && (
                <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {chatHistory.map((m, i) => (
                    <div key={i} style={{
                      padding: '8px 12px', borderRadius: 8, fontSize: 12, maxWidth: '90%',
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      background: m.role === 'user' ? 'var(--accent)' : 'var(--surface2)',
                      color: m.role === 'user' ? '#000' : 'var(--text)',
                    }}>{m.text}</div>
                  ))}
                  {chatting && <div style={{ fontSize: 12, color: 'var(--muted)', padding: '4px 12px' }}>AI 思考中...</div>}
                  <div ref={chatEndRef} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="例：image 不要局限于科技风..."
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13 }} />
                <button style={btn(true)} onClick={sendChat} disabled={chatting}>发送</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
