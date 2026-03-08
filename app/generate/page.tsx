'use client';
import { useEffect, useState, useRef } from 'react';

type Template = { id: number; name: string; platform: string; image_path: string; elements: unknown[] };
type Category = { id: number; name: string };
type Cover = { id: number; template_id: number; template_name: string; platform: string; template_image: string; image_path: string; status: string; error: string; log: string };
type Project = { id: number; title: string; status: string; covers: Cover[] };

const card = { background: 'var(--surface)', border: '5px solid var(--border)', padding: '24px' };
const btn = (accent = false, danger = false) => ({
  padding: '12px 24px', border: '3px solid var(--border)', textTransform: 'uppercase' as const, letterSpacing: '0.5px',
  background: accent ? 'var(--accent)' : danger ? '#ff3366' : 'var(--surface)',
  color: accent ? 'var(--text-inv)' : danger ? 'var(--text-inv)' : 'var(--text)',
  cursor: 'pointer', fontSize: 12, fontWeight: 700
});

export default function GeneratePage() {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Form state
  const [script, setScript] = useState('');
  const [title, setTitle] = useState('');
  const [generateTitle, setGenerateTitle] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [useFrameAnalysis, setUseFrameAnalysis] = useState(false);
  const [useTemplateRef, setUseTemplateRef] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [styleFile, setStyleFile] = useState<File | null>(null);
  const [stylePrompt, setStylePrompt] = useState('');
  const [size, setSize] = useState('16:9');
  const [generating, setGenerating] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const styleRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch('/api/templates').then(r => r.json()).then(setTemplates);
    fetch('/api/resource-categories').then(r => r.json()).then(setCategories);
    fetch('/api/projects').then(r => r.json()).then(setProjects);
  }, []);

  const toggleTemplate = (id: number) =>
    setSelectedTemplates(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleCategory = (id: number) =>
    setSelectedCategories(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const startGenerate = async () => {
    if (!selectedTemplates.length) return alert('请至少选择一个模板');
    if (!script && !videoFile) return alert('请输入文案或上传视频');
    setGenerating(true);
    const fd = new FormData();
    fd.append('template_ids', JSON.stringify(selectedTemplates));
    fd.append('category_ids', JSON.stringify(selectedCategories));
    fd.append('title', title);
    fd.append('script', script);
    fd.append('generate_title', String(generateTitle));
    fd.append('use_frame_analysis', String(useFrameAnalysis));
    fd.append('use_template_ref', String(useTemplateRef));
    fd.append('size', size);
    if (videoFile) fd.append('video', videoFile);
    if (styleFile) fd.append('style', styleFile);
    if (stylePrompt) fd.append('style_prompt', stylePrompt);

    const res = await fetch('/api/generate', { method: 'POST', body: fd });
    const { project_id } = await res.json();

    // Poll for results
    pollRef.current = setInterval(async () => {
      const p = await fetch(`/api/projects/${project_id}`).then(r => r.json());
      setCurrentProject(p);
      if (p.status === 'done' || p.status === 'error') {
        clearInterval(pollRef.current!);
        setGenerating(false);
        fetch('/api/projects').then(r => r.json()).then(setProjects);
      }
    }, 2000);
    setStep(5);
  };

  const loadProject = async (id: number) => {
    const p = await fetch(`/api/projects/${id}`).then(r => r.json());
    setCurrentProject(p); setStep(5);
  };

  const delProject = async (id: number) => {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (currentProject?.id === id) setCurrentProject(null);
    fetch('/api/projects').then(r => r.json()).then(setProjects);
  };

  const reset = () => {
    setStep(1); setScript(''); setTitle(''); setVideoFile(null); setStyleFile(null); setStylePrompt('');
    setSelectedTemplates([]); setSelectedCategories([]); setUseFrameAnalysis(false); setUseTemplateRef(true); setCurrentProject(null); setSize('16:9');
    if (pollRef.current) clearInterval(pollRef.current);
  };

  return (
    <div style={{ padding: '48px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 48, fontWeight: 800, margin: 0, color: 'var(--text-inv)', letterSpacing: '-1px' }}>生成封面</h1>
          <p style={{ color: 'var(--accent2)', marginTop: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>AI COVER GENERATOR</p>
        </div>
        {step > 1 && <button style={btn()} onClick={reset}>重新开始</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
        <div>
          {/* Step indicator */}
          {step < 5 && (
            <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
              {['上传视频', '选择模板', '选择资源', '参考图片'].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setStep(i + 1)}>
                    <div style={{ width: 32, height: 32, border: '3px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                      background: step === i + 1 ? 'var(--accent)' : step > i + 1 ? 'var(--accent2)' : 'var(--surface)',
                      color: step >= i + 1 ? 'var(--border)' : 'var(--text)' }}>
                      {step > i + 1 ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: step === i + 1 ? 'var(--text-inv)' : 'var(--text)' }}>{s}</span>
                  </div>
                  {i < 3 && <div style={{ width: 32, height: 3, background: step > i + 1 ? 'var(--accent2)' : 'var(--border)', margin: '0 12px' }} />}
                </div>
              ))}
            </div>
          )}

          {/* Step 1: Input */}
          {step === 1 && (
            <div style={card}>
              <h3 style={{ margin: '0 0 24px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)' }}>输入视频内容</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>上传视频</label>
                  <div style={{ border: '3px dashed var(--border)', padding: '24px', textAlign: 'center', cursor: 'pointer', background: videoFile ? 'var(--accent2)' : 'transparent' }}
                    onClick={() => videoRef.current?.click()}>
                    {videoFile ? (
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--border)' }}>✓ {videoFile.name} <button onClick={e => { e.stopPropagation(); setVideoFile(null); }} style={{ background: 'none', border: 'none', color: 'var(--border)', cursor: 'pointer', fontSize: 16 }}>×</button></div>
                    ) : (
                      <div style={{ color: 'var(--text)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>点击上传视频</div>
                    )}
                    <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => setVideoFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>文案内容</label>
                  <textarea value={script} onChange={e => setScript(e.target.value)} rows={6}
                    placeholder="粘贴视频文案..."
                    style={{ width: '100%', padding: '14px', border: '3px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>封面标题</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} disabled={generateTitle}
                    placeholder={generateTitle ? 'AI 自动生成' : '输入标题...'}
                    style={{ width: '100%', padding: '12px 14px', border: '3px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, opacity: generateTitle ? 0.5 : 1, fontFamily: 'inherit' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, cursor: 'pointer', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                    <input type="checkbox" checked={generateTitle} onChange={e => setGenerateTitle(e.target.checked)} style={{ width: 16, height: 16 }} />
                    <span style={{ color: 'var(--text)' }}>AI 自动生成标题</span>
                  </label>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>输出尺寸</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {['1:1', '4:3', '16:9', '9:16', '2:3', '3:4', '3:2', '21:9'].map(s => (
                      <div key={s} onClick={() => setSize(s)} style={{
                        padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                        border: '3px solid var(--border)',
                        background: size === s ? 'var(--accent)' : 'var(--surface2)',
                        color: size === s ? 'var(--text-inv)' : 'var(--text)',
                      }}>{s}</div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button style={btn(true)} onClick={() => setStep(2)}>下一步 →</button>
              </div>
            </div>
          )}

          {/* Step 2: Select templates */}
          {step === 2 && (
            <div style={card}>
              <h3 style={{ margin: '0 0 24px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)' }}>选择模板 <span style={{ color: 'var(--text)', opacity: 0.6, fontWeight: 400, fontSize: 11 }}>（已选 {selectedTemplates.length}）</span></h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {templates.map(t => (
                  <div key={t.id} onClick={() => toggleTemplate(t.id)} style={{
                    overflow: 'hidden', cursor: 'pointer',
                    border: selectedTemplates.includes(t.id) ? '5px solid var(--accent)' : '5px solid var(--border)'
                  }}>
                    <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: '#000' }}>
                      <img src={t.image_path} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '10px 12px', background: selectedTemplates.includes(t.id) ? 'var(--accent)' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: selectedTemplates.includes(t.id) ? 'var(--text-inv)' : 'var(--text)' }}>{t.name}</span>
                      {selectedTemplates.includes(t.id) && <span style={{ color: 'var(--text-inv)', fontSize: 14 }}>✓</span>}
                    </div>
                  </div>
                ))}
                {templates.length === 0 && <div style={{ gridColumn: '1/-1', color: 'var(--text)', textAlign: 'center', padding: 40, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>请先添加模板</div>}
              </div>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                <button style={btn()} onClick={() => setStep(1)}>← 上一步</button>
                <button style={btn(true)} onClick={() => setStep(3)}>下一步 →</button>
              </div>
            </div>
          )}

          {/* Step 3: Select resources */}
          {step === 3 && (
            <div style={card}>
              <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)' }}>选择资源分类</h3>
              <p style={{ color: 'var(--text)', fontSize: 11, marginBottom: 20, opacity: 0.7 }}>选择要使用的资源分类</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {categories.map(c => (
                  <div key={c.id} onClick={() => toggleCategory(c.id)} style={{
                    padding: '10px 20px', cursor: 'pointer', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                    border: '3px solid var(--border)',
                    background: selectedCategories.includes(c.id) ? 'var(--accent2)' : 'var(--surface2)',
                    color: selectedCategories.includes(c.id) ? 'var(--border)' : 'var(--text)'
                  }}>{c.name}</div>
                ))}
                {categories.length === 0 && <div style={{ color: 'var(--text)', fontSize: 12, opacity: 0.7 }}>暂无资源分类</div>}
              </div>
              {videoFile && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, cursor: 'pointer', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                  <input type="checkbox" checked={useFrameAnalysis} onChange={e => setUseFrameAnalysis(e.target.checked)} style={{ width: 16, height: 16 }} />
                  <span style={{ color: 'var(--text)' }}>从视频帧中寻找素材</span>
                </label>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, cursor: 'pointer', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                <input type="checkbox" checked={useTemplateRef} onChange={e => setUseTemplateRef(e.target.checked)} style={{ width: 16, height: 16 }} />
                <span style={{ color: 'var(--text)' }}>参考模板风格</span>
              </label>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                <button style={btn()} onClick={() => setStep(2)}>← 上一步</button>
                <button style={btn(true)} onClick={() => setStep(4)}>下一步 →</button>
              </div>
            </div>
          )}

          {/* Step 4: Style reference image */}
          {step === 4 && (
            <div style={card}>
              <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)' }}>参考图片</h3>
              <p style={{ color: 'var(--text)', fontSize: 11, marginBottom: 20, opacity: 0.7 }}>上传参考图或描述风格</p>
              <div style={{ border: '3px dashed var(--border)', padding: '24px', textAlign: 'center', cursor: 'pointer', background: styleFile ? 'var(--accent2)' : 'transparent' }}
                onClick={() => styleRef.current?.click()}>
                {styleFile ? (
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--border)' }}>✓ {styleFile.name}
                    <button onClick={e => { e.stopPropagation(); setStyleFile(null); }} style={{ background: 'none', border: 'none', color: 'var(--border)', cursor: 'pointer', fontSize: 16 }}>×</button>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>点击上传参考图</div>
                )}
                <input ref={styleRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setStyleFile(e.target.files?.[0] || null)} />
              </div>
              <textarea value={stylePrompt} onChange={e => setStylePrompt(e.target.value)} rows={3}
                placeholder="风格描述..."
                style={{ width: '100%', marginTop: 16, padding: '14px', border: '3px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                <button style={btn()} onClick={() => setStep(3)}>← 上一步</button>
                <button style={btn(true)} onClick={startGenerate} disabled={generating}>
                  {generating ? '生成中...' : '✦ 开始生成'}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Results */}
          {step === 5 && currentProject && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-syne), sans-serif', fontSize: 24, fontWeight: 800, color: 'var(--text-inv)' }}>{currentProject.title || '生成结果'}</h3>
                <span style={{ fontSize: 10, padding: '6px 14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
                  background: currentProject.status === 'done' ? 'var(--accent2)' : 'var(--accent)',
                  color: 'var(--border)', border: '3px solid var(--border)' }}>
                  {currentProject.status === 'done' ? '完成' : '处理中'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {currentProject.covers?.map(cover => (
                  <div key={cover.id} style={{ ...card, padding: 0, overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '16/9', background: '#000', position: 'relative' }}>
                      {cover.status === 'done' && cover.image_path
                        ? <img src={cover.image_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : cover.status === 'error'
                        ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ff3366', fontSize: 12, padding: 16, textAlign: 'center', fontWeight: 700 }}>
                            ✗ {cover.error?.slice(0, 100)}
                          </div>
                        : <div style={{ padding: '16px', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {cover.log ? (() => {
                              const logs = JSON.parse(cover.log) as string[];
                              return logs.map((entry, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 11 }}>
                                  <span style={{ flexShrink: 0, fontSize: 10, marginTop: 2, color: i === logs.length - 1 ? 'var(--accent)' : 'var(--accent2)' }}>
                                    {i === logs.length - 1 ? '⟳' : '✓'}
                                  </span>
                                  <span style={{ color: 'var(--text-inv)', lineHeight: 1.5, opacity: i === logs.length - 1 ? 1 : 0.7 }}>{entry}</span>
                                </div>
                              ));
                            })() : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-inv)' }}>
                                <span>⟳</span><span>排队中...</span>
                              </div>
                            )}
                          </div>}
                    </div>
                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface2)' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase' }}>{cover.template_name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text)', opacity: 0.6 }}>{cover.platform}</div>
                      </div>
                      {cover.status === 'done' && cover.image_path && (
                        <a href={cover.image_path} download style={{ ...btn(true), padding: '8px 16px', fontSize: 10, textDecoration: 'none' }}>下载</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* History sidebar */}
        <div style={{ ...card, height: 'fit-content' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1px' }}>历史项目</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {projects.map(p => (
              <div key={p.id} style={{ padding: '12px', background: currentProject?.id === p.id ? 'var(--accent)' : 'var(--surface2)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '3px solid var(--border)' }}
                onClick={() => loadProject(p.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase', color: currentProject?.id === p.id ? 'var(--text-inv)' : 'var(--text)' }}>{p.title || '无标题'}</div>
                  <div style={{ fontSize: 10, color: currentProject?.id === p.id ? 'var(--text-inv)' : 'var(--text)', opacity: 0.7, marginTop: 4 }}>{(p as Record<string, unknown>).cover_count as number} 封面</div>
                </div>
                <button onClick={e => { e.stopPropagation(); delProject(p.id); }}
                  style={{ background: 'none', border: 'none', color: currentProject?.id === p.id ? 'var(--text-inv)' : 'var(--text)', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>×</button>
              </div>
            ))}
            {projects.length === 0 && <div style={{ color: 'var(--text)', fontSize: 11, textAlign: 'center', padding: '24px 0', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.6 }}>暂无历史</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
