import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import fs from 'fs';
import path from 'path';
import * as db from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-vad-analysis-platform-key-2026';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // 1. Authenticate user (Bypassed)

    // 2. Resolve parameters (must await params in Next.js 15+)
    const resolvedParams = await params;
    const pathArray = resolvedParams.path;

    if (!pathArray || pathArray.length < 2) {
      return NextResponse.json({ error: 'Invalid file path requested' }, { status: 400 });
    }

    const analysisId = pathArray[0];
    const remainingPath = pathArray.slice(1);

    // 3. Verify existence of this analysis
    const analysis = db.getAnalysisById(analysisId);
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // 4. Resolve local file path
    const fileSubPath = path.join(...remainingPath);
    const localFilePath = path.join(process.cwd(), 'data', 'reports', analysisId, fileSubPath);

    // Security check: Prevent Directory Traversal
    const reportsRoot = path.join(process.cwd(), 'data', 'reports', analysisId);
    const relative = path.relative(reportsRoot, localFilePath);
    const isSafe = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
    
    if (!isSafe && localFilePath !== reportsRoot) {
      return NextResponse.json({ error: 'Access denied: Directory traversal detected' }, { status: 400 });
    }

    // Check if file exists
    if (!fs.existsSync(localFilePath) || fs.statSync(localFilePath).isDirectory()) {
      return NextResponse.json({ error: 'Requested file not found on server' }, { status: 404 });
    }

    // 5. Get file stats & determine Content-Type
    const stats = fs.statSync(localFilePath);
    const fileName = path.basename(localFilePath);
    const ext = path.extname(localFilePath).toLowerCase();

    let contentType = 'application/octet-stream';
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (ext === '.csv') {
      contentType = 'text/csv';
    } else if (ext === '.json') {
      contentType = 'application/json';
    } else if (ext === '.zip') {
      contentType = 'application/zip';
    } else if (ext === '.wav') {
      contentType = 'audio/wav';
    }

    // 6. Stream the file content (efficient memory usage)
    const nodeStream = fs.createReadStream(localFilePath);
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      }
    });

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', stats.size.toString());
    
    // For downloads (PDF/DOCX/ZIP/CSV) force attachments. WAVs can play inline or download depending on client.
    if (ext !== '.wav') {
      headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    } else {
      headers.set('Content-Disposition', `inline; filename="${fileName}"`);
    }

    return new NextResponse(webStream, { headers });

  } catch (error: any) {
    console.error('File streaming error:', error);
    return NextResponse.json({ error: 'Internal server error while retrieving file' }, { status: 500 });
  }
}
