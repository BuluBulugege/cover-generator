import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export function getAIClient() {
  return new OpenAI({
    apiKey: process.env.AI_API_KEY!,
    baseURL: process.env.AI_BASE_URL!,
  });
}

export const MODELS = {
  vision: process.env.VISION_MODEL || 'gemini-2.0-flash',
  analysis: process.env.ANALYSIS_MODEL || 'gemini-2.5-flash-preview-05-20',
  imageGen: process.env.IMAGE_GEN_MODEL || 'gemini-3-image-pro',
  videoScript: process.env.VIDEO_SCRIPT_MODEL || 'gemini-2.5-flash-preview-05-20',
};

export function imageToBase64(filePath: string): string {
  const abs = path.join(process.cwd(), 'public', filePath);
  const buf = fs.readFileSync(abs);
  const ext = filePath.split('.').pop()?.toLowerCase() || 'jpeg';
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

function logPrompt(fn: string, model: string, textParts: string[]) {
  console.log(`\n${'='.repeat(60)}\n[AI] ${fn} | model: ${model}`);
  textParts.forEach(t => console.log('[PROMPT]', t));
}

function logResponse(content: unknown) {
  const preview = typeof content === 'string'
    ? content.slice(0, 2000)
    : JSON.stringify(content)?.slice(0, 2000);
  console.log('[RESPONSE]', preview, '\n');
}

export async function analyzeTemplate(imagePath: string): Promise<object[]> {
  const ai = getAIClient();
  const b64 = imageToBase64(imagePath);
  const textPrompt = `分析这个视频封面模板图，提取所有视觉元素。这个模板将用于指导生成其他视频的封面，所以必须泛化，不能描述这张图片的具体内容。

返回JSON数组，每个元素包含：
{
  "type": "background|main_title|subtitle|image|logo|decoration",
  "description": "这个位置应该放什么类型的内容（泛化描述，如：视频主题的总结性标题、主角或相关人物的插画、品牌logo等，禁止出现具体文字或具体人物描述）",
  "constraints": "视觉风格约束（颜色、字体、风格、字数限制等，同样泛化，不针对这张图的具体内容）",
  "position": "位置描述（如：顶部居中、左下角等）",
  "required": true/false
}
只返回JSON数组，不要其他文字。`;
  logPrompt('analyzeTemplate', MODELS.analysis, [`[image: ${imagePath}]`, textPrompt]);
  const res = await ai.chat.completions.create({
    model: MODELS.analysis,
    messages: [{ role: 'user', content: [
      { type: 'image_url', image_url: { url: b64 } },
      { type: 'text', text: textPrompt }
    ]}],
  });
  logResponse(res.choices[0].message.content);
  const text = res.choices[0].message.content || '[]';
  const match = text.match(/\[[\s\S]*\]/);
  return JSON.parse(match ? match[0] : '[]');
}

export async function extractScriptFromVideo(videoPath: string): Promise<string> {
  const { execSync } = await import('child_process');
  const abs = path.join(process.cwd(), 'public', videoPath);
  const audioPath = abs.replace(/\.[^.]+$/, '_audio.mp3');
  try {
    execSync(`ffmpeg -i "${abs}" -vn -ar 16000 -ac 1 -b:a 64k "${audioPath}" -y 2>/dev/null`);
    const ai = getAIClient();
    console.log(`\n${'='.repeat(60)}\n[AI] extractScriptFromVideo | model: whisper-1\n[PROMPT] audio: ${audioPath}`);
    const transcription = await ai.audio.transcriptions.create({
      model: 'whisper-1',
      file: fs.createReadStream(audioPath),
    });
    logResponse(transcription.text);
    return transcription.text;
  } finally {
    try { fs.unlinkSync(audioPath); } catch {}
  }
}

export async function generateViralTitle(script: string, platform: string): Promise<string> {
  const ai = getAIClient();
  const prompt = `根据以下文案，为${platform === 'bilibili' ? 'B站' : 'YouTube'}生成一个爆款标题（10-20字，吸引眼球，有冲击力）：\n\n${script}\n\n只返回标题文字，不要其他内容。`;
  logPrompt('generateViralTitle', MODELS.analysis, [prompt]);
  const res = await ai.chat.completions.create({
    model: MODELS.analysis,
    messages: [{ role: 'user', content: prompt }],
  });
  logResponse(res.choices[0].message.content);
  return res.choices[0].message.content?.trim() || '';
}

type Element = { type: string; description: string; constraints: string; position?: string; required?: boolean };
type AdaptedElement = Element & { content: string };

export async function adaptElements(
  elements: Element[],
  title: string,
  script: string,
  styleImagePath?: string,
  stylePrompt?: string
): Promise<AdaptedElement[]> {
  const ai = getAIClient();
  const styleNote = stylePrompt ? `\n风格要求：${stylePrompt}` : '';
  const prompt = `根据视频标题和文案，为封面模板的每个元素确定具体内容。description 说明了该位置应放什么类型的内容。${styleNote}

标题：${title}
文案：${script.slice(0, 600)}

元素列表：
${JSON.stringify(elements, null, 2)}

为每个元素增加 content 字段：文字元素填写具体文字，图片元素填写图片内容描述（用于指导AI生成，需符合风格要求）。只返回JSON数组。`;
  const msgContent: OpenAI.ChatCompletionContentPart[] = [];
  if (styleImagePath) {
    msgContent.push({ type: 'image_url', image_url: { url: imageToBase64(styleImagePath) } });
  }
  msgContent.push({ type: 'text', text: prompt });
  logPrompt('adaptElements', MODELS.analysis, [styleImagePath ? `[style image: ${styleImagePath}]` : '', prompt].filter(Boolean));
  const res = await ai.chat.completions.create({
    model: MODELS.analysis,
    messages: [{ role: 'user', content: styleImagePath ? msgContent : prompt }],
  });
  logResponse(res.choices[0].message.content);
  const text = res.choices[0].message.content || '[]';
  const match = text.match(/\[[\s\S]*\]/);
  try {
    return JSON.parse(match ? match[0] : '[]');
  } catch {
    return elements.map(e => ({ ...e, content: '' }));
  }
}

export async function findSuitableFrames(videoPath: string, elementDesc: string): Promise<string[]> {
  const { execSync } = await import('child_process');
  const framesDir = `${process.cwd()}/public/uploads/frames`;
  const prefix = `frame_${Date.now()}`;

  try {
    const abs = path.join(process.cwd(), 'public', videoPath);
    execSync(`ffmpeg -i "${abs}" -vf "fps=1/10,scale=640:-1" -frames:v 6 "${framesDir}/${prefix}_%03d.jpg" -y 2>/dev/null`);
  } catch {
    return [];
  }

  const frames = fs.readdirSync(framesDir)
    .filter(f => f.startsWith(prefix))
    .map(f => `/uploads/frames/${f}`);

  if (!frames.length) return [];

  const ai = getAIClient();
  const textPrompt = `这些是视频帧（共${frames.length}张）。我需要找适合作为"${elementDesc}"的图片素材。请返回最合适的帧编号（1-${frames.length}），多个用逗号分隔，如果没有合适的返回空字符串。只返回数字。`;
  logPrompt('findSuitableFrames', MODELS.vision, [`[${frames.length} frames]`, textPrompt]);
  const content: OpenAI.ChatCompletionContentPart[] = frames.map(f => ({
    type: 'image_url' as const,
    image_url: { url: imageToBase64(f) }
  }));
  content.push({ type: 'text', text: textPrompt });

  const res = await ai.chat.completions.create({
    model: MODELS.vision,
    messages: [{ role: 'user', content }],
  });
  logResponse(res.choices[0].message.content);

  const nums = (res.choices[0].message.content || '').match(/\d+/g) || [];
  return nums.map(n => frames[parseInt(n) - 1]).filter(Boolean);
}

export async function generateCoverImage(
  templateImagePath: string,
  resourceImages: string[],
  elements: Array<{type: string, content?: string, constraints: string}>,
  title: string,
  platform: string,
  useTemplateRef: boolean,
  feedback?: string,
  size?: string,
): Promise<string> {
  const ai = getAIClient();
  const ratio = platform === 'bilibili' ? '4:3' : '16:9';

  const msgContent: OpenAI.ChatCompletionContentPart[] = [];
  if (useTemplateRef) {
    msgContent.push({ type: 'image_url', image_url: { url: imageToBase64(templateImagePath) } });
  }
  resourceImages.forEach(p => {
    msgContent.push({ type: 'image_url' as const, image_url: { url: imageToBase64(p) } });
  });

  const elementsDesc = elements
    .map(e => `- ${e.type}: ${e.content ? `内容="${e.content}"，` : ''}视觉效果=${e.constraints}`)
    .join('\n');

  let imgIdx = 1;
  const templateRef = useTemplateRef ? `图片${imgIdx++}` : null;
  const resourceRefs = resourceImages.length > 0
    ? `\n参考素材：${resourceImages.map(() => `图片${imgIdx++}`).join('、')}中的人物/logo等素材`
    : '';

  const sizeNote = size ? `\n输出图片比例：${size}。` : '';
  const feedbackNote = feedback ? `\n\n上一版问题，必须修正：${feedback}` : '';
  const textPrompt = useTemplateRef
    ? `大致复刻${templateRef}的文字/贴图摆放位置和结构。${resourceRefs}\n\n各元素内容与视觉要求：\n${elementsDesc}\n\n重要：确保所有文字元素完整显示在画面内，不得截断任何文字。${sizeNote}${feedbackNote}`
    : `生成一张${ratio}比例的${platform === 'bilibili' ? 'B站' : 'YouTube'}视频封面。${resourceRefs}\n\n各元素内容与视觉要求：\n${elementsDesc}\n\n重要：确保所有文字元素完整显示在画面内，不得截断任何文字。${sizeNote}${feedbackNote}`;

  logPrompt('generateCoverImage', MODELS.imageGen, [
    `useTemplateRef=${useTemplateRef}, template=${templateImagePath}`,
    `resourceImages=[${resourceImages.join(', ')}]`,
    textPrompt,
  ]);

  msgContent.push({ type: 'text', text: textPrompt });

  const res = await ai.chat.completions.create({
    model: MODELS.imageGen,
    messages: [{ role: 'user', content: msgContent }],
  });

  const msg = res.choices[0].message;
  const imgContent = (msg.content as unknown as Array<{type:string,image_url?:{url:string}}>);
  if (Array.isArray(imgContent)) {
    const imgPart = imgContent.find(p => p.type === 'image_url');
    if (imgPart?.image_url?.url) {
      console.log('[RESPONSE] generateCoverImage: received image_url part\n');
      const b64 = imgPart.image_url.url.replace(/^data:image\/\w+;base64,/, '');
      const outPath = `/uploads/covers/cover_${Date.now()}.png`;
      fs.writeFileSync(`${process.cwd()}/public${outPath}`, Buffer.from(b64, 'base64'));
      return outPath;
    }
  }
  if (typeof msg.content === 'string' && msg.content.includes('base64')) {
    const match = msg.content.match(/base64,([A-Za-z0-9+/=]+)/);
    if (match) {
      console.log('[RESPONSE] generateCoverImage: extracted base64 from string\n');
      const outPath = `/uploads/covers/cover_${Date.now()}.png`;
      fs.writeFileSync(`${process.cwd()}/public${outPath}`, Buffer.from(match[1], 'base64'));
      return outPath;
    }
  }
  logResponse(msg.content);
  throw new Error('Image generation returned no image data');
}

export async function matchResources(
  elements: Array<{type: string, content?: string, description: string}>,
  resources: Array<{name: string, file_path: string}>
): Promise<string[]> {
  if (!resources.length) return [];
  const ai = getAIClient();
  const needsMaterial = elements.filter(e => ['image', 'logo', 'decoration'].includes(e.type));
  if (!needsMaterial.length) return [];
  const prompt = `根据封面元素需求，从资源库中找出合适的素材文件。

元素需求：
${needsMaterial.map(e => `- ${e.type}: ${e.content || e.description}`).join('\n')}

可用资源（序号. 文件名）：
${resources.slice(0, 50).map((r, i) => `${i + 1}. ${r.name}`).join('\n')}

返回适合使用的资源序号，多个用逗号分隔。没有合适的返回空字符串。只返回数字。`;
  logPrompt('matchResources', MODELS.analysis, [prompt]);
  const res = await ai.chat.completions.create({
    model: MODELS.analysis,
    messages: [{ role: 'user', content: prompt }],
  });
  logResponse(res.choices[0].message.content);
  const nums = (res.choices[0].message.content || '').match(/\d+/g) || [];
  return nums.map(n => resources[parseInt(n) - 1]?.file_path).filter(Boolean);
}

export async function reviewCoverImage(
  imagePath: string,
  elements: Array<{type: string, content?: string, constraints: string}>,
): Promise<{ ok: boolean; feedback: string }> {
  const ai = getAIClient();
  const expected = elements.filter(e => e.content).map(e => `- ${e.type}: "${e.content}"`).join('\n');
  const prompt = `检查这张视频封面是否符合要求。

预期元素：
${expected}

检查：1.所有文字是否完整无截断 2.文字布局是否合理不重叠 3.主标题是否醒目

返回JSON：{"ok":true/false,"feedback":"若不ok则描述具体问题和改进方案"}
只返回JSON。`;
  logPrompt('reviewCoverImage', MODELS.analysis, [prompt]);
  const res = await ai.chat.completions.create({
    model: MODELS.analysis,
    messages: [{ role: 'user', content: [
      { type: 'image_url', image_url: { url: imageToBase64(imagePath) } },
      { type: 'text', text: prompt },
    ]}],
  });
  logResponse(res.choices[0].message.content);
  const text = res.choices[0].message.content || '';
  const match = text.match(/\{[\s\S]*\}/);
  try { return JSON.parse(match ? match[0] : '{"ok":true,"feedback":""}'); }
  catch { return { ok: true, feedback: '' }; }
}
