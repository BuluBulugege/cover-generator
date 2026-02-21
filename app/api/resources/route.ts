import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  const categoryId = req.nextUrl.searchParams.get('category_id');
  const db = getDb();
  const sql = categoryId
    ? 'SELECT r.*, rc.name as category_name FROM resources r JOIN resource_categories rc ON r.category_id = rc.id WHERE r.category_id = ? ORDER BY r.created_at DESC'
    : 'SELECT r.*, rc.name as category_name FROM resources r JOIN resource_categories rc ON r.category_id = rc.id ORDER BY r.created_at DESC';
  return NextResponse.json(categoryId ? db.prepare(sql).all(categoryId) : db.prepare(sql).all());
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const categoryId = form.get('category_id') as string;
  const name = form.get('name') as string;
  const file = form.get('file') as File;
  if (!categoryId || !name || !file) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop();
  const filename = `resource_${Date.now()}.${ext}`;
  const filePath = `/uploads/resources/${filename}`;
  await writeFile(path.join(process.cwd(), 'public', filePath), buf);

  const fileType = file.type.startsWith('video') ? 'video' : 'image';
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO resources (category_id, name, file_path, file_type) VALUES (?, ?, ?, ?)'
  ).run(categoryId, name, filePath, fileType);

  return NextResponse.json({ id: result.lastInsertRowid, category_id: categoryId, name, file_path: filePath, file_type: fileType });
}
