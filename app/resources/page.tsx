'use client';
import { useEffect, useState, useRef } from 'react';

type Category = { id: number; name: string };
type Resource = { id: number; category_id: number; name: string; file_path: string; file_type: string; category_name: string };

const card = { background: 'var(--surface)', border: '5px solid var(--border)', padding: '24px' };
const btn = (accent = false) => ({
  padding: '12px 24px', border: '3px solid var(--border)', textTransform: 'uppercase' as const, letterSpacing: '0.5px',
  background: accent ? 'var(--accent)' : 'var(--surface)',
  color: accent ? 'var(--text-inv)' : 'var(--text)',
  cursor: 'pointer', fontSize: 12, fontWeight: 700
});

export default function ResourcesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [newCat, setNewCat] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: '', category_id: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const loadCats = () => fetch('/api/resource-categories').then(r => r.json()).then(setCategories);
  const loadRes = (catId?: number) => {
    const url = catId ? `/api/resources?category_id=${catId}` : '/api/resources';
    fetch(url).then(r => r.json()).then(setResources);
  };

  useEffect(() => { loadCats(); loadRes(); }, []);

  const addCategory = async () => {
    if (!newCat.trim()) return;
    await fetch('/api/resource-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCat }) });
    setNewCat(''); loadCats();
  };

  const delCategory = async (id: number) => {
    if (!confirm('删除分类将同时删除其中所有资源，确认？')) return;
    await fetch(`/api/resource-categories/${id}`, { method: 'DELETE' });
    if (activeCat === id) setActiveCat(null);
    loadCats(); loadRes();
  };

  const uploadResource = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !uploadForm.name || !uploadForm.category_id) return;
    const fd = new FormData();
    fd.append('name', uploadForm.name); fd.append('category_id', uploadForm.category_id); fd.append('file', file);
    await fetch('/api/resources', { method: 'POST', body: fd });
    setShowUpload(false); setUploadForm({ name: '', category_id: '' });
    loadRes(activeCat || undefined);
  };

  const delResource = async (id: number) => {
    await fetch(`/api/resources/${id}`, { method: 'DELETE' });
    loadRes(activeCat || undefined);
  };

  const filtered = activeCat ? resources.filter(r => r.category_id === activeCat) : resources;

  return (
    <div style={{ padding: '48px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 48, fontWeight: 800, margin: 0, color: 'var(--text-inv)', letterSpacing: '-1px' }}>资源库</h1>
          <p style={{ color: 'var(--accent2)', marginTop: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>RESOURCE LIBRARY</p>
        </div>
        <button style={btn(true)} onClick={() => setShowUpload(true)}>+ 上传资源</button>
      </div>

      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: '#000c', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ ...card, width: 400 }}>
            <h3 style={{ margin: '0 0 24px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)' }}>上传资源</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input value={uploadForm.name} onChange={e => setUploadForm(f => ({ ...f, name: e.target.value }))}
                placeholder="资源名称" style={{ padding: '12px 14px', border: '3px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }} />
              <select value={uploadForm.category_id} onChange={e => setUploadForm(f => ({ ...f, category_id: e.target.value }))}
                style={{ padding: '12px 14px', border: '3px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }}>
                <option value="">选择分类</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input ref={fileRef} type="file" accept="image/*,video/*"
                style={{ padding: '12px 14px', border: '3px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13 }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button style={btn()} onClick={() => setShowUpload(false)}>取消</button>
              <button style={btn(true)} onClick={uploadResource}>上传</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
        {/* Sidebar categories */}
        <div style={{ ...card, height: 'fit-content' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1px' }}>分类</div>
          <div
            onClick={() => { setActiveCat(null); loadRes(); }}
            style={{ padding: '10px 12px', cursor: 'pointer', fontSize: 12, marginBottom: 6, border: '3px solid var(--border)',
              background: activeCat === null ? 'var(--accent)' : 'var(--surface2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
              color: activeCat === null ? 'var(--text-inv)' : 'var(--text)' }}>
            全部 ({resources.length})
          </div>
          {categories.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer', marginBottom: 6, border: '3px solid var(--border)',
              background: activeCat === c.id ? 'var(--accent)' : 'var(--surface2)' }}
              onClick={() => { setActiveCat(c.id); loadRes(c.id); }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: activeCat === c.id ? 'var(--text-inv)' : 'var(--text)' }}>{c.name}</span>
              <button onClick={e => { e.stopPropagation(); delCategory(c.id); }}
                style={{ background: 'none', border: 'none', color: activeCat === c.id ? 'var(--text-inv)' : 'var(--text)', cursor: 'pointer', fontSize: 16, padding: '0 2px' }}>×</button>
            </div>
          ))}
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()}
              placeholder="新分类" style={{ flex: 1, padding: '8px 10px', border: '3px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 11, fontFamily: 'inherit' }} />
            <button onClick={addCategory} style={{ ...btn(true), padding: '8px 12px', fontSize: 12 }}>+</button>
          </div>
        </div>

        {/* Resource grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, alignContent: 'start' }}>
          {filtered.map(r => (
            <div key={r.id} style={{ border: '5px solid var(--border)', overflow: 'hidden', background: 'var(--surface)' }}>
              <div style={{ aspectRatio: '1', background: '#000', overflow: 'hidden' }}>
                {r.file_type === 'image'
                  ? <img src={r.file_path} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <video src={r.file_path} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />}
              </div>
              <div style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface2)' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text)' }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.6, marginTop: 2 }}>{r.category_name}</div>
                </div>
                <button onClick={() => delResource(r.id)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 18 }}>×</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--text-inv)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>暂无资源</div>
          )}
        </div>
      </div>
    </div>
  );
}
