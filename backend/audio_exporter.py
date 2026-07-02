import os
import soundfile as sf
import numpy as np
from typing import List, Dict, Any

class AudioExporter:
    @staticmethod
    def export_audio_files(
        audio_data: np.ndarray,
        sr: int,
        segments: List[Dict[str, Any]],
        silence_segments: List[Dict[str, Any]],
        output_dir: str
    ) -> Dict[str, str]:
        """
        Generates and saves speech_only.wav, silence_only.wav, and individual segment files.
        Returns a dict of relative paths to the generated files.
        """
        os.makedirs(output_dir, exist_ok=True)
        segments_dir = os.path.join(output_dir, "segments")
        os.makedirs(segments_dir, exist_ok=True)

        results = {}

        # 1. Export speech_only.wav
        speech_chunks = []
        for seg in segments:
            start_idx = int(seg['start'] * sr)
            end_idx = int(seg['end'] * sr)
            speech_chunks.append(audio_data[start_idx:end_idx])
            
        speech_only_path = os.path.join(output_dir, "speech_only.wav")
        if speech_chunks:
            speech_only_data = np.concatenate(speech_chunks)
            sf.write(speech_only_path, speech_only_data, sr)
        else:
            # Write empty wav file
            sf.write(speech_only_path, np.array([], dtype=np.float32), sr)
        results["speech_only"] = "speech_only.wav"

        # 2. Export silence_only.wav
        silence_chunks = []
        for sil in silence_segments:
            start_idx = int(sil['start'] * sr)
            end_idx = int(sil['end'] * sr)
            silence_chunks.append(audio_data[start_idx:end_idx])
            
        silence_only_path = os.path.join(output_dir, "silence_only.wav")
        if silence_chunks:
            silence_only_data = np.concatenate(silence_chunks)
            sf.write(silence_only_path, silence_only_data, sr)
        else:
            # Write empty wav file
            sf.write(silence_only_path, np.array([], dtype=np.float32), sr)
        results["silence_only"] = "silence_only.wav"

        # 3. Export individual speech segments
        segment_paths = []
        for idx, seg in enumerate(segments):
            start_idx = int(seg['start'] * sr)
            end_idx = int(seg['end'] * sr)
            seg_data = audio_data[start_idx:end_idx]
            
            seg_filename = f"segment{idx+1:03d}.wav"
            seg_full_path = os.path.join(segments_dir, seg_filename)
            sf.write(seg_full_path, seg_data, sr)
            segment_paths.append(f"segments/{seg_filename}")
            
        results["segments"] = segment_paths
        return results
