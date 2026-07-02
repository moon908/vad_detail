import os
import torch
import librosa
import numpy as np
from typing import List, Dict, Any, Tuple

# Enable CPU fallback for PyTorch if needed
os.environ["TORCH_DEVICE"] = "cpu"

class VADEngine:
    def __init__(self):
        self.model = None
        self.utils = None
        self.device = torch.device("cpu")
        self._load_model()

    def _load_model(self):
        """Loads Silero VAD model from torch hub."""
        try:
            print("Loading Silero VAD model...")
            # Use torch.hub to load the model. Silero VAD is loaded on CPU.
            self.model, self.utils = torch.hub.load(
                repo_or_dir='snakers4/silero-vad',
                model='silero_vad',
                force_reload=False,
                trust_repo=True
            )
            # Set model to eval mode
            self.model.eval()
            print("Silero VAD model loaded successfully.")
        except Exception as e:
            print(f"Error loading Silero VAD model: {e}")
            raise e

    def preprocess_audio(self, file_path: str, target_sr: int = 16000) -> Tuple[np.ndarray, int, float]:
        """
        Loads, resamples to 16kHz, downmixes to mono, and normalizes audio.
        Returns:
            y: preprocessed audio numpy array
            sr: sample rate (always target_sr)
            duration: total duration of the original audio in seconds
        """
        # Load audio with librosa
        # sr=None preserves original sample rate, sr=16000 resamples it.
        # mono=True mixes multi-channel to mono.
        y, sr = librosa.load(file_path, sr=target_sr, mono=True)
        duration = float(len(y)) / sr

        # Normalize audio amplitude to [-1.0, 1.0] if there is any signal
        max_val = np.abs(y).max()
        if max_val > 0:
            y = y / max_val

        return y, sr, duration

    def detect_speech(self, audio_data: np.ndarray, sr: int = 16000, threshold: float = 0.5) -> List[Dict[str, float]]:
        """
        Runs Silero VAD on preprocessed audio and extracts speech segments.
        Returns:
            List of segments: [{'start': start_sec, 'end': end_sec, 'duration': duration_sec}]
        """
        if self.model is None or self.utils is None:
            self._load_model()

        get_speech_timestamps = self.utils[0]
        
        # Convert numpy array to torch tensor
        audio_tensor = torch.from_numpy(audio_data).float()
        
        # Get speech timestamps
        # threshold: speech threshold (0.5 is default)
        # min_speech_duration_ms: filter out shorter speech chunks
        # min_silence_duration_ms: group speech chunks separated by less than this silence
        speech_timestamps = get_speech_timestamps(
            audio_tensor,
            self.model,
            threshold=threshold,
            sampling_rate=sr,
            min_speech_duration_ms=250,
            min_silence_duration_ms=500
        )
        
        # Convert sample indexes to seconds
        segments = []
        for i, ts in enumerate(speech_timestamps):
            start_sec = round(float(ts['start']) / sr, 3)
            end_sec = round(float(ts['end']) / sr, 3)
            dur_sec = round(end_sec - start_sec, 3)
            segments.append({
                "id": i + 1,
                "start": start_sec,
                "end": end_sec,
                "duration": dur_sec
            })
            
        return segments

    def compute_statistics(self, segments: List[Dict[str, float]], total_duration: float) -> Dict[str, Any]:
        """
        Computes detailed speech and silence metrics from speech segments and total duration.
        """
        total_duration = round(total_duration, 3)
        num_speech_segments = len(segments)
        
        # Calculate total speech duration
        total_speech = round(sum(seg['duration'] for seg in segments), 3)
        total_speech = min(total_speech, total_duration)
        
        # Calculate total silence duration
        total_silence = round(max(0.0, total_duration - total_speech), 3)
        
        speech_pct = round((total_speech / total_duration) * 100, 2) if total_duration > 0 else 0.0
        silence_pct = round(100.0 - speech_pct, 2)
        
        # Longest, shortest, and average speech
        speech_durations = [seg['duration'] for seg in segments]
        longest_speech = round(max(speech_durations), 3) if speech_durations else 0.0
        shortest_speech = round(min(speech_durations), 3) if speech_durations else 0.0
        avg_speech = round(total_speech / num_speech_segments, 3) if num_speech_segments > 0 else 0.0
        
        # Extract silence segments
        silence_segments = []
        last_end = 0.0
        
        for i, seg in enumerate(segments):
            if seg['start'] > last_end:
                silence_segments.append({
                    "start": last_end,
                    "end": seg['start'],
                    "duration": round(seg['start'] - last_end, 3)
                })
            last_end = seg['end']
            
        if last_end < total_duration:
            silence_segments.append({
                "start": last_end,
                "end": total_duration,
                "duration": round(total_duration - last_end, 3)
            })
            
        num_silence_segments = len(silence_segments)
        silence_durations = [sil['duration'] for sil in silence_segments]
        avg_silence = round(total_silence / num_silence_segments, 3) if num_silence_segments > 0 else 0.0
        
        # Speaking speed calculation:
        # Standard adult speaking rate is ~130 to 150 words per minute (WPM) during speech time.
        # We estimate speed based on typical syllable rate: ~2.3 words per second (138 WPM) of speech duration.
        # Standard WPM heuristic = (Total Speech Duration in seconds / 60) * 140 WPM.
        speaking_wpm = 140.0
        estimated_words = int((total_speech / 60.0) * speaking_wpm)
        estimated_speaking_speed_wpm = speaking_wpm if total_speech > 0.5 else 0.0
        
        return {
            "duration": total_duration,
            "totalSpeech": total_speech,
            "totalSilence": total_silence,
            "speechPercentage": speech_pct,
            "silencePercentage": silence_pct,
            "speechSegmentsCount": num_speech_segments,
            "silenceSegmentsCount": num_silence_segments,
            "longestSpeech": longest_speech,
            "shortestSpeech": shortest_speech,
            "avgSpeech": avg_speech,
            "avgSilence": avg_silence,
            "estimatedWords": estimated_words,
            "estimatedSpeakingSpeedWpm": estimated_speaking_speed_wpm,
            "silenceSegments": silence_segments
        }

    def generate_ai_insights(self, stats: Dict[str, Any]) -> List[str]:
        """
        Generates context-aware, analytical AI observations using VAD metrics.
        """
        insights = []
        speech_pct = stats["speechPercentage"]
        avg_speech = stats["avgSpeech"]
        avg_silence = stats["avgSilence"]
        num_speech = stats["speechSegmentsCount"]
        num_silence = stats["silenceSegmentsCount"]
        
        # Insight 1: Speech density/distribution
        if speech_pct > 80:
            insights.append("Speech density is exceptionally high. The speaker talks continuously with minimal pause time.")
        elif speech_pct > 50:
            insights.append("Speech density is balanced. There is a healthy distribution between active speaking and pausing.")
        elif speech_pct > 20:
            insights.append("This recording contains frequent pauses. Silence is common, indicating potential hesitations or a structured turn-taking dialogue.")
        else:
            insights.append("Speech density is extremely low. The recording consists mostly of silence or background noise, with brief voice activity.")
            
        # Insight 2: Segment durations and flow
        if avg_speech > 5.0:
            insights.append("Long uninterrupted speech segments indicate a monologue, lecture, or single-speaker narrative style.")
        elif avg_speech > 1.5:
            insights.append("Speaking segments are conversational in length, typical of standard presentations or interactive dialogues.")
        else:
            insights.append("Speech segments are extremely short and rapid, which is common in short commands, interruptions, or high-noise files.")
            
        # Insight 3: Silence intervals
        if avg_silence > 3.0 and speech_pct > 20:
            insights.append("Pauses between speech are long. This structure is typical of Q&A sessions, language learning exercises, or dictated text.")
        elif avg_silence < 1.0 and speech_pct > 40:
            insights.append("The speaker moves quickly between thoughts, with minimal pause time. The flow is fast-paced.")
            
        # Insight 4: Processing suitability
        if speech_pct > 40 and avg_silence < 2.0:
            insights.append("The recording has a strong speech signal and is highly suitable for automated Speech-to-Text transcription.")
        elif speech_pct < 15:
            insights.append("Due to low voice activity, this file may require noise gating or signal amplification before speech-to-text processing.")
        else:
            insights.append("The recording is suitable for transcription; however, filtering out silence sections will improve transcription efficiency.")
            
        # Insight 5: Noise level
        if num_speech > 30 and avg_speech < 0.8:
            insights.append("High count of very short speech segments detected. This might indicate presence of intermittent background noise triggers.")
        else:
            insights.append("Background silence is clean and well-structured, with clear boundaries between speech and non-speech regions.")
            
        return insights
