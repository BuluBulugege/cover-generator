import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const r = db.prepare('SELECT * FROM resources WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const fp = path.join(process.cwd(), 'public', r.file_path as string);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
  db.prepare('DELETE FROM resources WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
