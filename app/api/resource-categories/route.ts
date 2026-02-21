import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare('SELECT * FROM resource_categories ORDER BY name').all());
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });
  const db = getDb();
  const result = db.prepare('INSERT INTO resource_categories (name) VALUES (?)').run(name);
  return NextResponse.json({ id: result.lastInsertRowid, name });
}
