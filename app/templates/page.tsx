'use client';
import { useEffect, useState, useRef } from 'react';

type Template = { id: number; name: string; platform: string; image_path: string; elements: Element[]; created_at: string };
type Element = { type: string; description: string; constraints: string; position: string; required: boolean };

const card = { background: 'var(--surface)', border: '5px solid var(--border)', padding: '24px' };
const btn = (accent = false) => ({
  padding: '12px 24px', border: '3px solid var(--border)', textTransform: 'uppercase' as const, letterSpacing: '0.5px',
  background: accent ? 'var(--accent)' : 'var(--surface)',
  color: accent ? 'var(--text-inv)' : 'var(--text)',
  cursor: 'pointer', fontSize: 12, fontWeight: 700
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
    <div style={{ padding: '48px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 48, fontWeight: 800, margin: 0, color: 'var(--text-inv)', letterSpacing: '-1px' }}>模板库</h1>
          <p style={{ color: 'var(--accent2)', marginTop: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>TEMPLATE LIBRARY</p>
        </div>
        <button style={btn(true)} onClick={() => setShowUpload(true)}>+ 上传模板</button>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: '#000c', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ ...card, width: 420 }}>
            <h3 style={{ margin: '0 0 24px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)' }}>上传模板</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="模板名称" style={{ padding: '12px 14px', border: '3px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }} />
              <input ref={fileRef} type="file" accept="image/*"
                style={{ padding: '12px 14px', border: '3px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13 }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button style={btn()} onClick={() => setShowUpload(false)}>取消</button>
              <button style={btn(true)} onClick={upload} disabled={uploading}>{uploading ? '上传中...' : '上传'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 24 }}>
        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20, alignContent: 'start' }}>
          {templates.map(t => (
            <div key={t.id} onClick={() => setSelected(t)} style={{
              border: selected?.id === t.id ? '5px solid var(--accent)' : '5px solid var(--border)',
              cursor: 'pointer', overflow: 'hidden', background: 'var(--surface)'
            }}>
              <div style={{ aspectRatio: t.platform === 'bilibili' ? '4/3' : '16/9', overflow: 'hidden', background: '#000' }}>
                <img src={t.image_path} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '12px 14px', background: selected?.id === t.id ? 'var(--accent)' : 'var(--surface2)' }}>
                <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, textTransform: 'uppercase', color: selected?.id === t.id ? 'var(--text-inv)' : 'var(--text)' }}>{t.name}</div>
                <div style={{ fontSize: 10, color: selected?.id === t.id ? 'var(--text-inv)' : 'var(--text)', opacity: 0.7 }}>{t.elements?.length || 0} 元素</div>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--text-inv)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              暂无模板
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ ...card, height: 'fit-content', position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)' }}>{selected.name}</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            <img src={selected.image_path} alt={selected.name} style={{ width: '100%', marginBottom: 20, border: '3px solid var(--border)' }} />
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button style={{ ...btn(true), flex: 1 }} onClick={() => analyze(selected.id)} disabled={analyzing}>
                {analyzing ? '分析中...' : '✦ AI 分析'}
              </button>
              <button style={{ ...btn(), background: '#ff3366', color: 'var(--text-inv)' }} onClick={() => del(selected.id)}>删除</button>
            </div>
            {selected.elements?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 12, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>元素约束</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selected.elements.map((el, i) => (
                    <div key={i} style={{ background: 'var(--surface2)', border: '3px solid var(--border)', padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, padding: '4px 10px', background: 'var(--accent)', color: 'var(--text-inv)', fontWeight: 700, textTransform: 'uppercase' }}>{el.type}</span>
                        {el.required && <span style={{ fontSize: 10, color: '#ff3366', fontWeight: 700 }}>必需</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text)', marginBottom: 4, fontWeight: 700 }}>{el.description}</div>
                      <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.7 }}>{el.constraints}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Chat */}
            <div style={{ borderTop: '3px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 12, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI 对话编辑</div>
              {chatHistory.length > 0 && (
                <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {chatHistory.map((m, i) => (
                    <div key={i} style={{
                      padding: '10px 12px', fontSize: 11, maxWidth: '90%', border: '3px solid var(--border)',
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      background: m.role === 'user' ? 'var(--accent)' : 'var(--surface2)',
                      color: m.role === 'user' ? 'var(--text-inv)' : 'var(--text)',
                    }}>{m.text}</div>
                  ))}
                  {chatting && <div style={{ fontSize: 11, color: 'var(--text)', padding: '4px 12px', opacity: 0.7 }}>AI 思考中...</div>}
                  <div ref={chatEndRef} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="输入指令..."
                  style={{ flex: 1, padding: '10px 12px', border: '3px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 11, fontFamily: 'inherit' }} />
                <button style={btn(true)} onClick={sendChat} disabled={chatting}>发送</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
