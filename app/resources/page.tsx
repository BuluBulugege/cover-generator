'use client';
import { useEffect, useState, useRef } from 'react';

type Category = { id: number; name: string };
type Resource = { id: number; category_id: number; name: string; file_path: string; file_type: string; category_name: string };

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 };
const btn = (accent = false) => ({
  padding: '8px 16px', borderRadius: 8, border: accent ? 'none' : '1px solid var(--border)',
  background: accent ? 'var(--accent)' : 'transparent', color: accent ? '#000' : 'var(--text)',
  cursor: 'pointer', fontSize: 13, fontWeight: 600
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
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>资源库</h1>
          <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 14 }}>管理人像、Logo 等固定素材</p>
        </div>
        <button style={btn(true)} onClick={() => setShowUpload(true)}>+ 上传资源</button>
      </div>

      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ ...card, padding: 28, width: 400 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>上传资源</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input value={uploadForm.name} onChange={e => setUploadForm(f => ({ ...f, name: e.target.value }))}
                placeholder="资源名称" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14 }} />
              <select value={uploadForm.category_id} onChange={e => setUploadForm(f => ({ ...f, category_id: e.target.value }))}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14 }}>
                <option value="">选择分类</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input ref={fileRef} type="file" accept="image/*,video/*"
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14 }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button style={btn()} onClick={() => setShowUpload(false)}>取消</button>
              <button style={btn(true)} onClick={uploadResource}>上传</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
        {/* Sidebar categories */}
        <div style={{ ...card, padding: 16, height: 'fit-content' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>分类</div>
          <div
            onClick={() => { setActiveCat(null); loadRes(); }}
            style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 14, marginBottom: 4,
              background: activeCat === null ? 'var(--surface2)' : 'transparent', fontWeight: activeCat === null ? 600 : 400 }}>
            全部 ({resources.length})
          </div>
          {categories.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
              background: activeCat === c.id ? 'var(--surface2)' : 'transparent' }}
              onClick={() => { setActiveCat(c.id); loadRes(c.id); }}>
              <span style={{ fontSize: 14, fontWeight: activeCat === c.id ? 600 : 400 }}>{c.name}</span>
              <button onClick={e => { e.stopPropagation(); delCategory(c.id); }}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}>×</button>
            </div>
          ))}
          <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
            <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()}
              placeholder="新分类名" style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 12 }} />
            <button onClick={addCategory} style={{ ...btn(true), padding: '6px 10px', fontSize: 12 }}>+</button>
          </div>
        </div>

        {/* Resource grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, alignContent: 'start' }}>
          {filtered.map(r => (
            <div key={r.id} style={{ ...card, overflow: 'hidden' }}>
              <div style={{ aspectRatio: '1', background: '#000', overflow: 'hidden' }}>
                {r.file_type === 'image'
                  ? <img src={r.file_path} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <video src={r.file_path} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />}
              </div>
              <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.category_name}</div>
                </div>
                <button onClick={() => delResource(r.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>暂无资源</div>
          )}
        </div>
      </div>
    </div>
  );
}
