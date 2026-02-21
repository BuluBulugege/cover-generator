'use client';
import { useEffect, useState, useRef } from 'react';

type Template = { id: number; name: string; platform: string; image_path: string; elements: unknown[] };
type Category = { id: number; name: string };
type Cover = { id: number; template_id: number; template_name: string; platform: string; template_image: string; image_path: string; status: string; error: string; log: string };
type Project = { id: number; title: string; status: string; covers: Cover[] };

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 };
const btn = (accent = false, danger = false) => ({
  padding: '10px 20px', borderRadius: 8, border: accent ? 'none' : danger ? '1px solid #ef444440' : '1px solid var(--border)',
  background: accent ? 'var(--accent)' : 'transparent',
  color: accent ? '#000' : danger ? '#ef4444' : 'var(--text)',
  cursor: 'pointer', fontSize: 14, fontWeight: 600
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
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>生成封面</h1>
          <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 14 }}>AI 驱动的视频封面生成</p>
        </div>
        {step > 1 && <button style={btn()} onClick={reset}>重新开始</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        <div>
          {/* Step indicator */}
          {step < 5 && (
            <div style={{ display: 'flex', gap: 0, marginBottom: 28 }}>
              {['输入内容', '选择模板', '选择资源', '参考图片'].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setStep(i + 1)}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
                      background: step === i + 1 ? 'var(--accent)' : step > i + 1 ? '#16a34a' : 'var(--surface2)',
                      color: step === i + 1 ? '#000' : step > i + 1 ? '#fff' : 'var(--muted)' }}>
                      {step > i + 1 ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? 'var(--text)' : 'var(--muted)' }}>{s}</span>
                  </div>
                  {i < 3 && <div style={{ width: 40, height: 1, background: 'var(--border)', margin: '0 8px' }} />}
                </div>
              ))}
            </div>
          )}

          {/* Step 1: Input */}
          {step === 1 && (
            <div style={{ ...card, padding: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>输入视频内容</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>上传视频（可选，将自动提取文案）</label>
                  <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => videoRef.current?.click()}>
                    {videoFile ? (
                      <div style={{ fontSize: 14 }}>✓ {videoFile.name} <button onClick={e => { e.stopPropagation(); setVideoFile(null); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>×</button></div>
                    ) : (
                      <div style={{ color: 'var(--muted)', fontSize: 14 }}>点击上传视频文件</div>
                    )}
                    <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => setVideoFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>文案内容（如已有视频可留空）</label>
                  <textarea value={script} onChange={e => setScript(e.target.value)} rows={6}
                    placeholder="粘贴视频文案或脚本内容..."
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>封面标题</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} disabled={generateTitle}
                    placeholder={generateTitle ? 'AI 将自动生成爆款标题' : '输入封面标题...'}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14, opacity: generateTitle ? 0.5 : 1 }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={generateTitle} onChange={e => setGenerateTitle(e.target.checked)} />
                    <span style={{ color: 'var(--muted)' }}>AI 自动生成爆款标题</span>
                  </label>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>输出尺寸</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['1:1', '4:3', '16:9', '9:16', '2:3', '3:4', '3:2', '21:9'].map(s => (
                      <div key={s} onClick={() => setSize(s)} style={{
                        padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13,
                        border: size === s ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: size === s ? '#f9731620' : 'transparent',
                        color: size === s ? 'var(--accent)' : 'var(--text)',
                      }}>{s}</div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button style={btn(true)} onClick={() => setStep(2)}>下一步 →</button>
              </div>
            </div>
          )}

          {/* Step 2: Select templates */}
          {step === 2 && (
            <div style={{ ...card, padding: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>选择模板 <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 13 }}>（已选 {selectedTemplates.length} 个）</span></h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {templates.map(t => (
                  <div key={t.id} onClick={() => toggleTemplate(t.id)} style={{
                    borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                    border: selectedTemplates.includes(t.id) ? '2px solid var(--accent)' : '2px solid var(--border)'
                  }}>
                    <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: '#000' }}>
                      <img src={t.image_path} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '8px 12px', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</span>
                      {selectedTemplates.includes(t.id) && <span style={{ color: 'var(--accent)', fontSize: 16 }}>✓</span>}
                    </div>
                  </div>
                ))}
                {templates.length === 0 && <div style={{ gridColumn: '1/-1', color: 'var(--muted)', textAlign: 'center', padding: 40 }}>请先在模板库中添加模板</div>}
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
                <button style={btn()} onClick={() => setStep(1)}>← 上一步</button>
                <button style={btn(true)} onClick={() => setStep(3)}>下一步 →</button>
              </div>
            </div>
          )}

          {/* Step 3: Select resources */}
          {step === 3 && (
            <div style={{ ...card, padding: 24 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>选择资源分类</h3>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>选择要使用的资源分类，AI 将从中匹配合适的素材</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {categories.map(c => (
                  <div key={c.id} onClick={() => toggleCategory(c.id)} style={{
                    padding: '8px 18px', borderRadius: 20, cursor: 'pointer', fontSize: 14, fontWeight: 500,
                    border: selectedCategories.includes(c.id) ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: selectedCategories.includes(c.id) ? '#f9731620' : 'transparent',
                    color: selectedCategories.includes(c.id) ? 'var(--accent)' : 'var(--text)'
                  }}>{c.name}</div>
                ))}
                {categories.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>暂无资源分类（可跳过）</div>}
              </div>
              {videoFile && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={useFrameAnalysis} onChange={e => setUseFrameAnalysis(e.target.checked)} />
                  <span style={{ color: 'var(--muted)' }}>从视频帧中寻找匹配素材（软件UI截图、终端截图等场景适用）</span>
                </label>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={useTemplateRef} onChange={e => setUseTemplateRef(e.target.checked)} />
                <span style={{ color: 'var(--muted)' }}>参考模板图片风格和构图</span>
              </label>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button style={btn()} onClick={() => setStep(2)}>← 上一步</button>
                <button style={btn(true)} onClick={() => setStep(4)}>下一步 →</button>
              </div>
            </div>
          )}

          {/* Step 4: Style reference image */}
          {step === 4 && (
            <div style={{ ...card, padding: 24 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>生成风格 / 参考背景图片</h3>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>可选。上传参考图或用文字描述风格，AI 将参考其整体配色和氛围</p>
              <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer' }}
                onClick={() => styleRef.current?.click()}>
                {styleFile ? (
                  <div style={{ fontSize: 14 }}>✓ {styleFile.name}
                    <button onClick={e => { e.stopPropagation(); setStyleFile(null); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>×</button>
                  </div>
                ) : (
                  <div style={{ color: 'var(--muted)', fontSize: 14 }}>点击上传参考图片（可选）</div>
                )}
                <input ref={styleRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setStyleFile(e.target.files?.[0] || null)} />
              </div>
              <textarea value={stylePrompt} onChange={e => setStylePrompt(e.target.value)} rows={3}
                placeholder="风格描述（可选）：例如 赛博朋克风格，深蓝色调，霓虹灯光效果..."
                style={{ width: '100%', marginTop: 12, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, resize: 'vertical' }} />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{currentProject.title || '生成结果'}</h3>
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20,
                  background: currentProject.status === 'done' ? '#16a34a20' : '#f9731620',
                  color: currentProject.status === 'done' ? '#16a34a' : '#f97316' }}>
                  {currentProject.status === 'done' ? '完成' : '处理中...'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {currentProject.covers?.map(cover => (
                  <div key={cover.id} style={{ ...card, overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '16/9', background: '#000', position: 'relative' }}>
                      {cover.status === 'done' && cover.image_path
                        ? <img src={cover.image_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : cover.status === 'error'
                        ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ef4444', fontSize: 13, padding: 16, textAlign: 'center' }}>
                            ✗ {cover.error?.slice(0, 100)}
                          </div>
                        : <div style={{ padding: '14px', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {cover.log ? (() => {
                              const logs = JSON.parse(cover.log) as string[];
                              return logs.map((entry, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
                                  <span style={{ flexShrink: 0, fontSize: 10, marginTop: 2, color: i === logs.length - 1 ? 'var(--accent)' : '#16a34a' }}>
                                    {i === logs.length - 1 ? '⟳' : '✓'}
                                  </span>
                                  <span style={{ color: i === logs.length - 1 ? 'var(--text)' : 'var(--muted)', lineHeight: 1.5 }}>{entry}</span>
                                </div>
                              ));
                            })() : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
                                <span>⟳</span><span>排队等待中...</span>
                              </div>
                            )}
                          </div>}
                    </div>
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{cover.template_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{cover.template_name}</div>
                      </div>
                      {cover.status === 'done' && cover.image_path && (
                        <a href={cover.image_path} download style={{ ...btn(true), padding: '6px 12px', fontSize: 12, textDecoration: 'none' }}>下载</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* History sidebar */}
        <div style={{ ...card, padding: 16, height: 'fit-content' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>历史项目</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {projects.map(p => (
              <div key={p.id} style={{ padding: '10px 12px', borderRadius: 8, background: currentProject?.id === p.id ? 'var(--surface2)' : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => loadProject(p.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title || '无标题'}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{(p as Record<string, unknown>).cover_count as number} 封面</div>
                </div>
                <button onClick={e => { e.stopPropagation(); delProject(p.id); }}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>×</button>
              </div>
            ))}
            {projects.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>暂无历史</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
