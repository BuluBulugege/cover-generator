import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const projects = db.prepare(`
    SELECT p.*, COUNT(gc.id) as cover_count,
    SUM(CASE WHEN gc.status='done' THEN 1 ELSE 0 END) as done_count
    FROM projects p
    LEFT JOIN generated_covers gc ON gc.project_id = p.id
    GROUP BY p.id ORDER BY p.created_at DESC
  `).all();
  return NextResponse.json(projects);
}
