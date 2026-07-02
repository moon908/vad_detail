import os
import shutil
import uuid
import tempfile
from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

from vad_engine import VADEngine
from audio_exporter import AudioExporter
from report_generator import ReportGenerator

app = FastAPI(
    title="Voice Activity Detection (VAD) Inference Microservice",
    description="FastAPI service running Silero VAD for audio segmentation and analysis.",
    version="1.0.0"
)

# Enable CORS for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base directories
BASE_DATA_DIR = os.getenv("DATA_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "data"))
UPLOADS_DIR = os.path.join(BASE_DATA_DIR, "uploads")
REPORTS_DIR = os.path.join(BASE_DATA_DIR, "reports")

# Ensure directories exist
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

# Initialize VAD engine globally on startup
print("Initializing VAD Engine...")
try:
    vad_engine = VADEngine()
except Exception as e:
    print(f"WARNING: VAD Engine failed to initialize on start: {e}. It will lazy load on request.")
    vad_engine = None

def get_vad_engine():
    global vad_engine
    if vad_engine is None:
        vad_engine = VADEngine()
    return vad_engine

def format_file_size(size_bytes: int) -> str:
    """Helper to convert bytes to human-readable size."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"

@app.get("/health")
def health_check():
    """Simple health check endpoint."""
    return {
        "status": "healthy",
        "service": "vad-analysis-backend",
        "device": "cpu",
        "engine_ready": vad_engine is not None
    }

@app.post("/api/analyze")
async def analyze_audio(
    file: UploadFile = File(...),
    threshold: float = Query(0.5, ge=0.1, le=0.9)
):
    """
    Accepts an audio file, runs Voice Activity Detection, 
    computes stats, generates reports and audio splits.
    """
    # 1. Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".wav", ".mp3", ".flac", ".ogg", ".m4a", ".aac"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(allowed_exts)}"
        )

    # Generate a unique analysis ID
    analysis_id = str(uuid.uuid4())
    
    # Define directory for reports
    analysis_reports_dir = os.path.join(REPORTS_DIR, analysis_id)
    os.makedirs(analysis_reports_dir, exist_ok=True)

    # Paths
    temp_upload_path = os.path.join(UPLOADS_DIR, f"{analysis_id}{ext}")

    try:
        # 2. Save uploaded file to local disk (in uploads directory)
        with open(temp_upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_size = os.path.getsize(temp_upload_path)
        formatted_size = format_file_size(file_size)

        # 3. Load VAD Engine and run preprocessing
        engine = get_vad_engine()
        y, sr, duration = engine.preprocess_audio(temp_upload_path)

        # 4. Perform Speech Detection
        segments = engine.detect_speech(y, sr, threshold=threshold)

        # 5. Compute speech-silence metrics
        stats = engine.compute_statistics(segments, duration)
        
        # 6. Generate AI insights
        ai_insights = engine.generate_ai_insights(stats)

        # 7. Export sliced audio files (speech_only, silence_only, individual segments)
        audio_exports = AudioExporter.export_audio_files(
            audio_data=y,
            sr=sr,
            segments=segments,
            silence_segments=stats["silenceSegments"],
            output_dir=analysis_reports_dir
        )

        # 8. Generate Report documents
        csv_name = "report.csv"
        json_name = "report.json"
        pdf_name = "report.pdf"
        docx_name = "report.docx"
        zip_name = "bundle.zip"

        csv_path = os.path.join(analysis_reports_dir, csv_name)
        json_path = os.path.join(analysis_reports_dir, json_name)
        pdf_path = os.path.join(analysis_reports_dir, pdf_name)
        docx_path = os.path.join(analysis_reports_dir, docx_name)
        zip_path = os.path.join(analysis_reports_dir, zip_name)

        # Write CSV & JSON
        ReportGenerator.generate_csv(segments, csv_path)
        # Stats dictionary has 'silenceSegments' which has raw numpy representation or floats;
        # report generation JSON wants to include stats without raw silenceSegments or format them.
        ReportGenerator.generate_json(stats, segments, json_path)

        # Render PDF and DOCX reports (passing a temporary folder to store intermediate matplotlib figures)
        with tempfile.TemporaryDirectory() as temp_plot_dir:
            # Build PDF
            ReportGenerator.generate_pdf(
                stats=stats,
                segments=segments,
                audio_data=y,
                sr=sr,
                pdf_path=pdf_path,
                temp_dir=temp_plot_dir,
                filename=file.filename,
                filesize_formatted=formatted_size,
                ai_insights=ai_insights
            )

            # Build DOCX
            ReportGenerator.generate_docx(
                stats=stats,
                segments=segments,
                docx_path=docx_path,
                temp_dir=temp_plot_dir,
                filename=file.filename,
                filesize_formatted=formatted_size,
                ai_insights=ai_insights
            )

        # 9. Pack everything into a ZIP bundle
        files_to_pack = {
            "report.pdf": pdf_path,
            "report.docx": docx_path,
            "report.csv": csv_path,
            "report.json": json_path,
            "speech_only.wav": os.path.join(analysis_reports_dir, "speech_only.wav"),
            "silence_only.wav": os.path.join(analysis_reports_dir, "silence_only.wav")
        }
        segments_folder = os.path.join(analysis_reports_dir, "segments")
        ReportGenerator.generate_zip(zip_path, files_to_pack, segments_folder)

        # Remove the uploaded raw file from uploads to save disk space
        if os.path.exists(temp_upload_path):
            os.remove(temp_upload_path)

        # 10. Assemble URLs to expose to the frontend
        report_urls = {
            "pdf": f"/api/reports/{analysis_id}/report.pdf",
            "docx": f"/api/reports/{analysis_id}/report.docx",
            "csv": f"/api/reports/{analysis_id}/report.csv",
            "json": f"/api/reports/{analysis_id}/report.json",
            "zip": f"/api/reports/{analysis_id}/bundle.zip",
            "speech_only": f"/api/reports/{analysis_id}/speech_only.wav",
            "silence_only": f"/api/reports/{analysis_id}/silence_only.wav",
            "segments": [f"/api/reports/{analysis_id}/{p}" for p in audio_exports["segments"]]
        }

        # Build final response structure
        return {
            "analysisId": analysis_id,
            "filename": file.filename,
            "fileSize": file_size,
            "formattedSize": formatted_size,
            "format": ext.strip(".").upper(),
            "duration": duration,
            "segments": segments,
            "statistics": {
                "totalSpeech": stats["totalSpeech"],
                "totalSilence": stats["totalSilence"],
                "speechPercentage": stats["speechPercentage"],
                "silencePercentage": stats["silencePercentage"],
                "speechSegmentsCount": stats["speechSegmentsCount"],
                "silenceSegmentsCount": stats["silenceSegmentsCount"],
                "longestSpeech": stats["longestSpeech"],
                "shortestSpeech": stats["shortestSpeech"],
                "avgSpeech": stats["avgSpeech"],
                "avgSilence": stats["avgSilence"],
                "estimatedWords": stats["estimatedWords"],
                "estimatedSpeakingSpeedWpm": stats["estimatedSpeakingSpeedWpm"]
            },
            "aiInsights": ai_insights,
            "reportUrls": report_urls
        }

    except Exception as e:
        # Cleanup uploaded file on error
        if os.path.exists(temp_upload_path):
            os.remove(temp_upload_path)
        # Re-raise or wrap exception
        import traceback
        traceback.print_exc()
        
        err_type = type(e).__name__
        err_msg = str(e)
        
        if err_type == "NoBackendError":
            detail = (
                "The server lacks the FFmpeg audio decoder backend required to decode this compressed format (e.g. MP3/M4A). "
                "Please upload a standard WAV file instead, or install FFmpeg on the server."
            )
        elif err_type == "LibsndfileError" or "soundfile" in type(e).__module__:
            detail = (
                f"Failed to read audio file format: {err_msg if err_msg else 'Unsupported or corrupted format'}. "
                "Please verify the file is a valid, uncorrupted WAV or MP3 audio recording."
            )
        else:
            detail = f"An error occurred during audio processing: {err_msg}" if err_msg else "An unexpected error occurred during audio processing."
            
        raise HTTPException(
            status_code=400 if (err_type in ["NoBackendError", "LibsndfileError"] or "soundfile" in type(e).__module__) else 500,
            detail=detail
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
