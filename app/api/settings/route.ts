import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env.local');

function readEnv(): Record<string, string> {
  if (!fs.existsSync(ENV_PATH)) return {};
  return Object.fromEntries(
    fs.readFileSync(ENV_PATH, 'utf-8').split('\n')
      .filter(l => l.includes('=') && !l.startsWith('#'))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
  );
}

export async function GET() {
  return NextResponse.json(readEnv());
}

export async function POST(req: NextRequest) {
  const vals = await req.json() as Record<string, string>;
  const existing = readEnv();
  // Only update non-empty values
  for (const [k, v] of Object.entries(vals)) {
    if (v.trim()) existing[k] = v.trim();
  }
  const content = Object.entries(existing).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
  fs.writeFileSync(ENV_PATH, content);
  return NextResponse.json({ ok: true });
}
