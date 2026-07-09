import os
import sys

# Redirect stdout to stderr temporarily so that any library load logs go to stderr
_real_stdout = sys.stdout
sys.stdout = sys.stderr

import argparse
import json
import tempfile
import traceback

from vad_engine import VADEngine
from audio_exporter import AudioExporter
from report_generator import ReportGenerator


def format_file_size(size_bytes: int) -> str:
    """Helper to convert bytes to human-readable size."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"

def main():
    parser = argparse.ArgumentParser(description="VAD Analysis CLI Utility")
    parser.add_argument("--file", required=True, help="Path to input audio file")
    parser.add_argument("--threshold", type=float, default=0.5, help="VAD threshold")
    parser.add_argument("--analysis-id", required=True, help="Analysis ID")
    parser.add_argument("--output-dir", required=True, help="Output directory for reports and audio slices")
    
    args = parser.parse_args()
    
    try:
        if not os.path.exists(args.file):
            print(json.dumps({"error": f"File not found: {args.file}"}))
            sys.exit(1)
            
        os.makedirs(args.output_dir, exist_ok=True)
        
        file_size = os.path.getsize(args.file)
        formatted_size = format_file_size(file_size)
        ext = os.path.splitext(args.file)[1].lower()
        
        # Load VAD Engine
        vad_engine = VADEngine()
        
        # Preprocess
        y, sr, duration = vad_engine.preprocess_audio(args.file)
        
        # Detect Speech
        segments = vad_engine.detect_speech(y, sr, threshold=args.threshold)
        
        # Compute Stats
        stats = vad_engine.compute_statistics(segments, duration)
        
        # AI Insights
        ai_insights = vad_engine.generate_ai_insights(stats)
        
        # Export sliced audio
        audio_exports = AudioExporter.export_audio_files(
            audio_data=y,
            sr=sr,
            segments=segments,
            silence_segments=stats["silenceSegments"],
            output_dir=args.output_dir
        )
        
        # Generate reports
        csv_name = "report.csv"
        json_name = "report.json"
        pdf_name = "report.pdf"
        docx_name = "report.docx"
        zip_name = "bundle.zip"
        
        csv_path = os.path.join(args.output_dir, csv_name)
        json_path = os.path.join(args.output_dir, json_name)
        pdf_path = os.path.join(args.output_dir, pdf_name)
        docx_path = os.path.join(args.output_dir, docx_name)
        zip_path = os.path.join(args.output_dir, zip_name)
        
        ReportGenerator.generate_csv(segments, csv_path)
        ReportGenerator.generate_json(stats, segments, json_path)
        
        with tempfile.TemporaryDirectory() as temp_plot_dir:
            ReportGenerator.generate_pdf(
                stats=stats,
                segments=segments,
                audio_data=y,
                sr=sr,
                pdf_path=pdf_path,
                temp_dir=temp_plot_dir,
                filename=os.path.basename(args.file),
                filesize_formatted=formatted_size,
                ai_insights=ai_insights
            )
            
            ReportGenerator.generate_docx(
                stats=stats,
                segments=segments,
                docx_path=docx_path,
                temp_dir=temp_plot_dir,
                filename=os.path.basename(args.file),
                filesize_formatted=formatted_size,
                ai_insights=ai_insights
            )
            
        files_to_pack = {
            "report.pdf": pdf_path,
            "report.docx": docx_path,
            "report.csv": csv_path,
            "report.json": json_path,
            "speech_only.wav": os.path.join(args.output_dir, "speech_only.wav"),
            "silence_only.wav": os.path.join(args.output_dir, "silence_only.wav")
        }
        segments_folder = os.path.join(args.output_dir, "segments")
        ReportGenerator.generate_zip(zip_path, files_to_pack, segments_folder)
        
        # Assemble URLs (relative to API)
        report_urls = {
            "pdf": f"/api/reports/{args.analysis_id}/report.pdf",
            "docx": f"/api/reports/{args.analysis_id}/report.docx",
            "csv": f"/api/reports/{args.analysis_id}/report.csv",
            "json": f"/api/reports/{args.analysis_id}/report.json",
            "zip": f"/api/reports/{args.analysis_id}/bundle.zip",
            "speech_only": f"/api/reports/{args.analysis_id}/speech_only.wav",
            "silence_only": f"/api/reports/{args.analysis_id}/silence_only.wav",
            "segments": [f"/api/reports/{args.analysis_id}/{p}" for p in audio_exports["segments"]]
        }
        
        # Print output JSON
        output_data = {
            "analysisId": args.analysis_id,
            "filename": os.path.basename(args.file),
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
        
        # Restore stdout to print the JSON result
        sys.stdout = _real_stdout
        print(json.dumps(output_data))
        sys.exit(0)
        
    except Exception as e:
        err_msg = str(e)
        err_type = type(e).__name__
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({"error": err_msg, "type": err_type}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
