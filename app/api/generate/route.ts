import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  extractScriptFromVideo, generateViralTitle,
  findSuitableFrames, generateCoverImage, adaptElements, reviewCoverImage, matchResources
} from '@/lib/ai';
import { writeFile } from 'fs/promises';
import path from 'path';

async function log(coverId: number, entry: string) {
  const db = getDb();
  const row = db.prepare('SELECT log FROM generated_covers WHERE id = ?').get(coverId) as {log: string} | undefined;
  const logs: string[] = row?.log ? JSON.parse(row.log) : [];
  logs.push(entry);
  db.prepare('UPDATE generated_covers SET log = ? WHERE id = ?').run(JSON.stringify(logs), coverId);
}

async function withConcurrency<T>(fns: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = [];
  const queue = [...fns];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const fn = queue.shift()!;
      results.push(await fn());
    }
  });
  await Promise.all(workers);
  return results;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const templateIds = JSON.parse(form.get('template_ids') as string || '[]') as number[];
  const categoryIds = JSON.parse(form.get('category_ids') as string || '[]') as number[];
  let title = form.get('title') as string || '';
  let script = form.get('script') as string || '';
  const generateTitle = form.get('generate_title') === 'true';
  const useFrameAnalysis = form.get('use_frame_analysis') === 'true';
  const useTemplateRef = form.get('use_template_ref') !== 'false';
  const stylePrompt = form.get('style_prompt') as string || '';
  const size = form.get('size') as string || '';
  const videoFile = form.get('video') as File | null;
  const styleFile = form.get('style') as File | null;

  if (!templateIds.length) return NextResponse.json({ error: 'No templates selected' }, { status: 400 });

  const db = getDb();

  // Save video if provided
  let videoPath = '';
  if (videoFile) {
    const buf = Buffer.from(await videoFile.arrayBuffer());
    const ext = videoFile.name.split('.').pop();
    const filename = `video_${Date.now()}.${ext}`;
    videoPath = `/uploads/frames/${filename}`;
    await writeFile(path.join(process.cwd(), 'public', videoPath), buf);
  }

  let stylePath = '';
  if (styleFile) {
    const buf = Buffer.from(await styleFile.arrayBuffer());
    const ext = styleFile.name.split('.').pop();
    stylePath = `/uploads/frames/style_${Date.now()}.${ext}`;
    await writeFile(path.join(process.cwd(), 'public', stylePath), buf);
  }

  // Create project
  const proj = db.prepare(
    'INSERT INTO projects (title, script, video_path, status) VALUES (?, ?, ?, ?)'
  ).run(title, script, videoPath, 'processing');
  const projectId = proj.lastInsertRowid as number;

  // Create cover placeholders
  for (const tid of templateIds) {
    db.prepare(
      'INSERT INTO generated_covers (project_id, template_id, status) VALUES (?, ?, ?)'
    ).run(projectId, tid, 'pending');
  }

  // Process async (don't await - return project ID immediately)
  processProject(projectId, templateIds, categoryIds, title, script, videoPath, generateTitle, useFrameAnalysis, useTemplateRef, stylePath, stylePrompt, size).catch(console.error);

  return NextResponse.json({ project_id: projectId });
}

async function processProject(
  projectId: number,
  templateIds: number[],
  categoryIds: number[],
  title: string,
  script: string,
  videoPath: string,
  generateTitle: boolean,
  useFrameAnalysis: boolean,
  useTemplateRef: boolean,
  stylePath: string,
  stylePrompt: string,
  size: string
) {
  const db = getDb();

  try {
    // Immediately mark all covers with initial log so UI shows progress
    const allCovers = db.prepare('SELECT id FROM generated_covers WHERE project_id = ?').all(projectId) as {id: number}[];

    // Step 1: Extract script from video if needed
    if (!script && videoPath) {
      for (const c of allCovers) await log(c.id, '🎬 提取视频文案中...');
      script = await extractScriptFromVideo(videoPath);
      db.prepare('UPDATE projects SET script = ? WHERE id = ?').run(script, projectId);
    }

    // Step 2: Generate title if needed
    if (!title || generateTitle) {
      for (const c of allCovers) await log(c.id, '✏️ 生成爆款标题中...');
      const templates = db.prepare('SELECT platform FROM templates WHERE id IN (' + templateIds.map(() => '?').join(',') + ')').all(...templateIds) as Array<{platform: string}>;
      const platform = templates[0]?.platform || 'bilibili';
      title = await generateViralTitle(script, platform);
      db.prepare('UPDATE projects SET title = ? WHERE id = ?').run(title, projectId);
    }

    // Step 3: Get resources from selected categories
    const resources = categoryIds.length
      ? db.prepare(`SELECT * FROM resources WHERE category_id IN (${categoryIds.map(() => '?').join(',')}) AND file_type = 'image'`).all(...categoryIds) as Array<{file_path: string}>
      : [];

    // Step 4: Process each template concurrently (max 5)
    const tasks = templateIds.map(tid => async () => {
      const cover = db.prepare('SELECT * FROM generated_covers WHERE project_id = ? AND template_id = ?').get(projectId, tid) as Record<string, unknown>;
      db.prepare('UPDATE generated_covers SET status = ? WHERE id = ?').run('processing', cover.id);

      try {
        const cid = cover.id as number;
        const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(tid) as Record<string, unknown>;
        const elements: Array<{type: string, description: string, constraints: string}> = template.elements ? JSON.parse(template.elements as string) : [];

        await log(cid, `📋 元素适配阶段 — 共 ${elements.length} 个元素: ${elements.map(e => e.type).join(', ')}`);

        const imageElements = elements.filter(e => ['image', 'background'].includes(e.type));
        let imageResources = resources.map(r => r.file_path);

        if (imageResources.length > 0) {
          await log(cid, `🗂 资源库匹配: 找到 ${imageResources.length} 张图片`);
        }

        if (videoPath && imageElements.length > 0 && useFrameAnalysis) {
          await log(cid, `🎬 视频帧分析: 扫描 ${imageElements.slice(0, 2).map(e => e.constraints).join('、')} 相关帧`);
          for (const el of imageElements.slice(0, 2)) {
            const frames = await findSuitableFrames(videoPath, el.constraints);
            if (frames.length) await log(cid, `  ✓ "${el.constraints}" 匹配到 ${frames.length} 帧`);
            imageResources = [...imageResources, ...frames];
          }
        }

        imageResources = [...new Set(imageResources)].slice(0, 5);
        await log(cid, `✏️ 元素内容适配中...`);
        const adaptedElements = await adaptElements(elements, title, script, stylePath || undefined, stylePrompt || undefined);

        // Auto-match resources from library based on element needs
        const allResources = db.prepare(`SELECT name, file_path FROM resources WHERE file_type = 'image'`).all() as Array<{name: string, file_path: string}>;
        const matched = await matchResources(adaptedElements, allResources);
        if (matched.length) {
          await log(cid, `🗂 自动匹配素材: ${matched.length} 个`);
          imageResources = [...new Set([...imageResources, ...matched])].slice(0, 5);
        }

        await log(cid, `🖼 生成图片阶段 — 调用 ${process.env.IMAGE_GEN_MODEL || 'gemini-3-pro-image-preview'}...`);
        let outPath = await generateCoverImage(
          template.image_path as string, imageResources, adaptedElements,
          title, template.platform as string, useTemplateRef, undefined, size || undefined,
        );

        for (let i = 0; i < 3; i++) {
          const review = await reviewCoverImage(outPath, adaptedElements);
          if (review.ok) break;
          await log(cid, `🔍 审核调整 ${i + 1}/3: ${review.feedback}`);
          outPath = await generateCoverImage(
            template.image_path as string, imageResources, adaptedElements,
            title, template.platform as string, useTemplateRef, review.feedback, size || undefined,
          );
        }

        db.prepare('UPDATE generated_covers SET status = ?, image_path = ? WHERE id = ?').run('done', outPath, cover.id);
      } catch (err) {
        db.prepare('UPDATE generated_covers SET status = ?, error = ? WHERE id = ?').run('error', String(err), cover.id);
      }
    });

    await withConcurrency(tasks, 5);
    db.prepare('UPDATE projects SET status = ? WHERE id = ?').run('done', projectId);
  } catch (err) {
    const allCovers = db.prepare('SELECT id FROM generated_covers WHERE project_id = ?').all(projectId) as {id: number}[];
    for (const c of allCovers) {
      db.prepare('UPDATE generated_covers SET status = ?, error = ? WHERE id = ?').run('error', String(err), c.id);
    }
    db.prepare('UPDATE projects SET status = ? WHERE id = ?').run('error', projectId);
  }
}
