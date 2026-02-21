import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const covers = db.prepare(`
    SELECT gc.*, t.name as template_name, t.platform, t.image_path as template_image
    FROM generated_covers gc
    JOIN templates t ON gc.template_id = t.id
    WHERE gc.project_id = ?
  `).all(id);
  return NextResponse.json({ ...project, covers });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getDb().prepare('DELETE FROM projects WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
