import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import * as db from '@/lib/db';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-vad-analysis-platform-key-2026';
const secretKey = new TextEncoder().encode(JWT_SECRET);

// Helper to determine Python execution path
function getPythonPath(): string {
  const isWindows = process.platform === 'win32';
  const venvPath = isWindows
    ? path.join(process.cwd(), 'venv', 'Scripts', 'python.exe')
    : path.join(process.cwd(), 'venv', 'bin', 'python');

  if (fs.existsSync(venvPath)) {
    return venvPath;
  }
  return 'python';
}

export async function POST(request: NextRequest) {
  let tempUploadPath = '';
  try {
    // 1. Authenticate user (Bypassed - use static guest user)
    const userId = 'default-user-id';

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

    // Save uploaded file temporarily
    const analysisId = crypto.randomUUID();
    const ext = path.extname(file.name).toLowerCase();
    
    // Ensure directories exist
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    const reportsDir = path.join(process.cwd(), 'data', 'reports');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    tempUploadPath = path.join(uploadsDir, `${analysisId}${ext}`);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(tempUploadPath, buffer);

    // 3. Execute VAD CLI Python script
    const pythonPath = getPythonPath();
    const cliScriptPath = path.join(process.cwd(), 'backend', 'cli.py');
    const outputDir = path.join(reportsDir, analysisId);

    const cliArgs = [
      cliScriptPath,
      '--file', tempUploadPath,
      '--threshold', thresholdVal,
      '--analysis-id', analysisId,
      '--output-dir', outputDir
    ];

    const child = spawn(pythonPath, cliArgs);

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    const exitCode = await new Promise<number>((resolve) => {
      child.on('close', (code) => {
        resolve(code ?? 0);
      });
    });

    // Cleanup temporary uploaded file on completion/error
    if (tempUploadPath && fs.existsSync(tempUploadPath)) {
      fs.unlinkSync(tempUploadPath);
    }

    if (exitCode !== 0) {
      console.error('Python CLI exited with error code:', exitCode, 'Stderr:', stderrData);
      
      let errorMessage = 'An error occurred during audio processing.';
      let statusCode = 500;
      
      try {
        const errorJson = JSON.parse(stderrData.trim().split('\n').pop() || '{}');
        if (errorJson.error) {
          const errType = errorJson.type;
          const errMsg = errorJson.error;
          
          if (errType === "NoBackendError") {
            errorMessage = (
              "The server lacks the FFmpeg audio decoder backend required to decode this compressed format (e.g. MP3/M4A). " +
              "Please upload a standard WAV file instead, or install FFmpeg on the server."
            );
            statusCode = 400;
          } else if (errType === "LibsndfileError" || errMsg.includes("soundfile")) {
            errorMessage = (
              `Failed to read audio file format: ${errMsg || 'Unsupported or corrupted format'}. ` +
              "Please verify the file is a valid, uncorrupted WAV or MP3 audio recording."
            );
            statusCode = 400;
          } else {
            errorMessage = `Inference engine error: ${errMsg}`;
          }
        }
      } catch (e) {
        // Stderr was not JSON or parsing failed, check plain text
        if (stderrData.includes('NoBackendError')) {
          errorMessage = "The server lacks the FFmpeg audio decoder backend. Please upload a standard WAV file.";
          statusCode = 400;
        } else if (stderrData.includes('soundfile') || stderrData.includes('LibsndfileError')) {
          errorMessage = "Failed to read audio format. Please ensure it's a valid WAV or MP3.";
          statusCode = 400;
        }
      }
      
      return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }

    let data;
    try {
      data = JSON.parse(stdoutData.trim());
    } catch (parseErr) {
      console.error('Failed to parse stdout JSON:', stdoutData, parseErr);
      return NextResponse.json({ 
        error: 'Failed to parse inference engine output response.' 
      }, { status: 500 });
    }

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
    // Ensure cleanup of temp file
    if (tempUploadPath && fs.existsSync(tempUploadPath)) {
      try {
        fs.unlinkSync(tempUploadPath);
      } catch (e) {}
    }
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred during analysis.' 
    }, { status: 500 });
  }
}

