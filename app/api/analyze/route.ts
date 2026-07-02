import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import * as db from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-vad-analysis-platform-key-2026';
const secretKey = new TextEncoder().encode(JWT_SECRET);
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId = '';
    try {
      const { payload } = await jwtVerify(token, secretKey);
      userId = payload.userId as string;
    } catch (err) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // 2. Parse request formData
    const requestFormData = await request.formData();
    const file = requestFormData.get('file') as File | null;
    const thresholdVal = requestFormData.get('threshold') as string || '0.5';

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Validate size (e.g., 50MB) and type
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds the 50MB limit.' }, { status: 400 });
    }

    // 3. Forward to FastAPI backend
    const apiFormData = new FormData();
    // Re-create the file blob in form data
    apiFormData.append('file', file, file.name);

    let backendResponse;
    try {
      backendResponse = await fetch(`${BACKEND_URL}/api/analyze?threshold=${thresholdVal}`, {
        method: 'POST',
        body: apiFormData,
        // Disable cache
        cache: 'no-store',
      });
    } catch (fetchErr) {
      console.error('Failed to communicate with FastAPI backend:', fetchErr);
      return NextResponse.json({ 
        error: 'The AI analysis service is currently offline or unreachable. Please try again later.' 
      }, { status: 503 });
    }

    if (!backendResponse.ok) {
      const errText = await backendResponse.text();
      let errDetail = 'Inference service error';
      try {
        const errJson = JSON.parse(errText);
        errDetail = errJson.detail || errDetail;
      } catch (e) {}
      
      return NextResponse.json({ error: errDetail }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();

    // 4. Save results to db.json
    const newAnalysis = db.createAnalysis({
      id: data.analysisId,
      userId: userId,
      filename: data.filename,
      fileSize: data.fileSize,
      formattedSize: data.formattedSize,
      format: data.format,
      duration: data.duration,
      speechPercentage: data.statistics.speechPercentage,
      silencePercentage: data.statistics.silencePercentage,
      totalSpeech: data.statistics.totalSpeech,
      totalSilence: data.statistics.totalSilence,
      speechSegmentsCount: data.statistics.speechSegmentsCount,
      silenceSegmentsCount: data.statistics.silenceSegmentsCount,
      longestSpeech: data.statistics.longestSpeech,
      shortestSpeech: data.statistics.shortestSpeech,
      avgSpeech: data.statistics.avgSpeech,
      avgSilence: data.statistics.avgSilence,
      estimatedWords: data.statistics.estimatedWords,
      estimatedSpeakingSpeedWpm: data.statistics.estimatedSpeakingSpeedWpm,
      status: 'COMPLETED',
      reportUrls: data.reportUrls,
      aiInsights: data.aiInsights,
      segments: data.segments,
    });

    return NextResponse.json(newAnalysis);

  } catch (error: any) {
    console.error('Audio analysis error:', error);
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred during analysis.' 
    }, { status: 500 });
  }
}
