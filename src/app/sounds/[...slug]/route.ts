import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

function tryReadFile(filePath: string): Buffer | null {
  try {
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  context: { params: { slug: string[] } }
) {
  try {
    const parts = Array.isArray(context.params?.slug) ? context.params.slug : [];
    if (parts.length === 0) return new NextResponse('Not Found', { status: 404 });
    const filename = parts[parts.length - 1];

    // Only allow simple filenames to avoid path traversal
    if (!/^[a-zA-Z0-9_.-]+$/.test(filename)) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    const cwd = process.cwd();
    const baseDir = path.join(cwd, 'sounds');
    const primary = path.join(baseDir, filename);

    // Fallback for case difference of extension: try swapping .mp3/.MP3
    let data = tryReadFile(primary);
    if (!data) {
      if (filename.toLowerCase().endsWith('.mp3')) {
        const alt = filename.endsWith('.mp3')
          ? filename.replace(/\.mp3$/, '.MP3')
          : filename.replace(/\.MP3$/, '.mp3');
        const altPath = path.join(baseDir, alt);
        data = tryReadFile(altPath);
      }
    }

    if (!data) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (e) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


