import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAIClient, MODELS } from '@/lib/ai';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { message, elements } = await req.json();

  const ai = getAIClient();
  const res = await ai.chat.completions.create({
    model: MODELS.analysis,
    messages: [{
      role: 'user',
      content: `你是视频封面模板设计助手。模板元素用于指导生成其他视频的封面，description 必须是泛化的"这里放什么类型内容"，constraints 是视觉风格约束，两者都不能包含具体文字或具体人物描述。

当前元素：
${JSON.stringify(elements, null, 2)}

用户要求：${message}

修改后返回JSON（只返回JSON）：
{"reply":"简短回复","elements":[完整元素数组]}`
    }],
    max_tokens: 2000,
  });

  const text = res.choices[0].message.content || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ error: 'AI返回格式错误' }, { status: 500 });

  const { reply, elements: newElements } = JSON.parse(match[0]);
  getDb().prepare('UPDATE templates SET elements = ? WHERE id = ?').run(JSON.stringify(newElements), id);
  return NextResponse.json({ reply, elements: newElements });
}
