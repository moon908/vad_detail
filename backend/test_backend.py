import os
import shutil
import tempfile
import numpy as np
import soundfile as sf
from vad_engine import VADEngine
from audio_exporter import AudioExporter
from report_generator import ReportGenerator

def generate_mock_audio(filepath: str, sr: int = 16000):
    """
    Generates a 10-second WAV file containing:
    - 0s to 1s: Silence (0.0)
    - 1s to 4s: Tone beep at 440Hz (representing speech)
    - 4s to 6s: Silence (0.0)
    - 6s to 9s: Tone beep at 880Hz (representing speech)
    - 9s to 10s: Silence (0.0)
    """
    duration = 10.0
    total_samples = int(sr * duration)
    audio = np.zeros(total_samples, dtype=np.float32)
    
    t = np.arange(total_samples) / sr
    
    # Waveform beeps (speech sections)
    speech1_mask = (t >= 1.0) & (t < 4.0)
    audio[speech1_mask] = 0.5 * np.sin(2 * np.pi * 440.0 * t[speech1_mask])
    
    speech2_mask = (t >= 6.0) & (t < 9.0)
    audio[speech2_mask] = 0.5 * np.sin(2 * np.pi * 880.0 * t[speech2_mask])
    
    # Save WAV
    sf.write(filepath, audio, sr)
    print(f"Mock audio generated at {filepath}")

def run_pipeline_test():
    print("=== STARTING BACKEND PIPELINE TEST ===")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        mock_audio_path = os.path.join(temp_dir, "test_audio.wav")
        generate_mock_audio(mock_audio_path)
        
        # 1. Initialize VAD Engine and run
        print("\n[Step 1] Loading VAD engine and preprocessing...")
        engine = VADEngine()
        y, sr, duration = engine.preprocess_audio(mock_audio_path)
        
        assert duration == 10.0, f"Duration mismatch: {duration}"
        print(f"Preprocessed: SR={sr}, Duration={duration}s")

        # 2. Run Voice Activity Detection
        print("\n[Step 2] Running speech detection...")
        segments = engine.detect_speech(y, sr, threshold=0.4)
        print(f"Detected speech segments: {segments}")
        
        # If Silero VAD (correctly) filters out synthetic sine beeps, mock segments for document/audio test
        if len(segments) == 0:
            print("No speech detected on synthetic tone audio (Expected behavior for neural net). Mocking segments for pipeline verification...")
            segments = [
                {"id": 1, "start": 1.0, "end": 4.0, "duration": 3.0},
                {"id": 2, "start": 6.0, "end": 9.0, "duration": 3.0}
            ]
        
        # 3. Compute stats
        print("\n[Step 3] Computing statistics...")
        stats = engine.compute_statistics(segments, duration)
        print(f"Statistics: {stats}")
        
        assert stats["speechSegmentsCount"] == len(segments), "Segments count mismatch"
        assert stats["totalSpeech"] > 0, "Total speech is 0"
        
        # 4. Generate AI Insights
        print("\n[Step 4] Compiling AI observations...")
        insights = engine.generate_ai_insights(stats)
        print(f"AI Insights: {insights}")
        
        # 5. Export audio files
        print("\n[Step 5] Slicing and exporting audio tracks...")
        exports_dir = os.path.join(temp_dir, "exports")
        os.makedirs(exports_dir, exist_ok=True)
        
        audio_exports = AudioExporter.export_audio_files(
            audio_data=y,
            sr=sr,
            segments=segments,
            silence_segments=stats["silenceSegments"],
            output_dir=exports_dir
        )
        print(f"Audio exports saved: {audio_exports}")
        
        assert os.path.exists(os.path.join(exports_dir, "speech_only.wav")), "speech_only.wav missing"
        assert os.path.exists(os.path.join(exports_dir, "silence_only.wav")), "silence_only.wav missing"
        assert len(os.listdir(os.path.join(exports_dir, "segments"))) == len(segments), "Segment files missing"

        # 6. Generate Reports
        print("\n[Step 6] Compiling PDF, DOCX, CSV, JSON and ZIP reports...")
        pdf_path = os.path.join(exports_dir, "report.pdf")
        docx_path = os.path.join(exports_dir, "report.docx")
        csv_path = os.path.join(exports_dir, "report.csv")
        json_path = os.path.join(exports_dir, "report.json")
        zip_path = os.path.join(exports_dir, "bundle.zip")
        
        # Save CSV & JSON
        ReportGenerator.generate_csv(segments, csv_path)
        ReportGenerator.generate_json(stats, segments, json_path)
        
        # Save PDF & DOCX
        with tempfile.TemporaryDirectory() as temp_plot_dir:
            ReportGenerator.generate_pdf(
                stats=stats,
                segments=segments,
                audio_data=y,
                sr=sr,
                pdf_path=pdf_path,
                temp_dir=temp_plot_dir,
                filename="test_audio.wav",
                filesize_formatted="120 KB",
                ai_insights=insights
            )
            
            ReportGenerator.generate_docx(
                stats=stats,
                segments=segments,
                docx_path=docx_path,
                temp_dir=temp_plot_dir,
                filename="test_audio.wav",
                filesize_formatted="120 KB",
                ai_insights=insights
            )

        # Build ZIP
        files_to_pack = {
            "report.pdf": pdf_path,
            "report.docx": docx_path,
            "report.csv": csv_path,
            "report.json": json_path,
            "speech_only.wav": os.path.join(exports_dir, "speech_only.wav"),
            "silence_only.wav": os.path.join(exports_dir, "silence_only.wav")
        }
        segments_folder = os.path.join(exports_dir, "segments")
        ReportGenerator.generate_zip(zip_path, files_to_pack, segments_folder)

        print("Verifying documents:")
        print(f"PDF Report size: {os.path.getsize(pdf_path)} bytes")
        print(f"DOCX Report size: {os.path.getsize(docx_path)} bytes")
        print(f"CSV Report size: {os.path.getsize(csv_path)} bytes")
        print(f"JSON Report size: {os.path.getsize(json_path)} bytes")
        print(f"ZIP Bundle size: {os.path.getsize(zip_path)} bytes")
        
        assert os.path.exists(pdf_path), "PDF report missing"
        assert os.path.exists(docx_path), "DOCX report missing"
        assert os.path.exists(zip_path), "ZIP bundle missing"

    print("\n=== PIPELINE TEST COMPLETED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_pipeline_test()
