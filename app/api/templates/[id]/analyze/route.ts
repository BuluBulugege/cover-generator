import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { analyzeTemplate } from '@/lib/ai';

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const t = db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const elements = await analyzeTemplate(t.image_path as string);
  db.prepare('UPDATE templates SET elements = ? WHERE id = ?').run(JSON.stringify(elements), id);
  return NextResponse.json({ elements });
}
