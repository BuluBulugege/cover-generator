import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function GET() {
  const db = getDb();
  const templates = db.prepare('SELECT * FROM templates ORDER BY created_at DESC').all() as Record<string, unknown>[];
  return NextResponse.json(templates.map(t => ({
    ...t,
    elements: t.elements ? JSON.parse(t.elements as string) : []
  })));
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const name = form.get('name') as string;
  const file = form.get('image') as File;

  if (!name || !file) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop();
  const filename = `template_${Date.now()}.${ext}`;
  const filePath = `/uploads/templates/${filename}`;
  await writeFile(path.join(process.cwd(), 'public', filePath), buf);

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO templates (name, platform, image_path) VALUES (?, ?, ?)'
  ).run(name, 'universal', filePath);

  return NextResponse.json({ id: result.lastInsertRowid, name, image_path: filePath, elements: [] });
}
