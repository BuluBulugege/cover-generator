import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const t = db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...t, elements: t.elements ? JSON.parse(t.elements as string) : [] });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const t = db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const filePath = path.join(process.cwd(), 'public', t.image_path as string);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  db.prepare('UPDATE generated_covers SET template_id = NULL WHERE template_id = ?').run(id);
  db.prepare('DELETE FROM templates WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
