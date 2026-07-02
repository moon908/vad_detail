# Voice Activity Detection (VAD) Analysis Platform

A premium, full-stack Voice Activity Detection (VAD) acoustic analysis and report generation platform. Built with **Next.js 16 (App Router)** and a **FastAPI Python microservice** running **Silero VAD** on PyTorch.

---

## Key Features

- **Precision Neural VAD**: Runs a pre-trained PyTorch-based Silero Voice Activity Detector for accurate speech mapping.
- **Dynamic Waveform Visualizer**: Pre-renders local audio waveforms on a canvas before uploading.
- **Interactive Threshold Adjustments**: Adjust detection sensitivity (0.1 - 0.9) to filter noise.
- **Rich Analytics & Charts**: Interactive graphs tracking speech percentages, pausity ratio, and segment distributions.
- **AI-Powered Insights**: Heuristic speech evaluation engine providing observations on conversational flow, speed, and transcription suitability.
- **Enterprise Reports**: Generate professional ReportLab PDFs (with custom layouts and embedded charts), Word DOCX files, CSV logs, and JSON datasets.
- **Isolated WAV Slicing**: Download speech-only or silence-only composite tracks, or individual segment slices.
- **JWT Authorization**: Cookie-based authentication protecting the dashboard and file downloads.
- **Docker-Ready**: Multi-stage docker files bound with docker-compose for immediate local orchestration.

---

## System Architecture

The project consists of a Next.js web application functioning as the user interface and secure API Gateway, alongside a FastAPI microservice that processes audio signals and compiles documents. A shared volume stores uploads and reports, permitting cross-container access.

```
                  ┌───────────────────────┐
                  │      Web Browser      │
                  └───────────┬───────────┘
                              │ HTTP (Port 3000)
                              ▼
┌───────────────────────────────────────────────────────────┐
│ Next.js Frontend App                                      │
│                                                           │
│ ┌───────────────────┐  ┌────────────────┐  ┌────────────┐ │
│ │  UI Dashboard     │  │ Server Actions │  │ Middleware │ │
│ │  (React/Recharts) │  │  (Auth & DB)   │  │  (Edge)    │ │
│ └───────────────────┘  └───────┬────────┘  └────────────┘ │
└────────────────────────────────┼──────────────────────────┘
                                 │
                                 │ HTTP (Port 8000) /api/analyze
                                 ▼
┌───────────────────────────────────────────────────────────┐
│ FastAPI Backend Microservice                              │
│                                                           │
│ ┌───────────────────┐  ┌────────────────┐  ┌────────────┐ │
│ │   FastAPI Router  │  │   Silero VAD   │  │ ReportLab  │ │
│ │    (Endpoints)    │  │ (PyTorch Model)│  │ /docx Gen  │ │
│ └───────────────────┘  └────────────────┘  └────────────┘ │
└────────────────────────────────┬──────────────────────────┘
                                 │ Writes
                                 ▼
┌───────────────────────────────────────────────────────────┐
│ Shared Volume (./data)                                    │
│                                                           │
│ ┌───────────────────┐  ┌────────────────┐  ┌────────────┐ │
│ │      db.json      │  │    uploads/    │  │  reports/  │ │
│ │   (Database DB)   │  │  (Temp Audio)  │  │ (Artifacts)│ │
│ └───────────────────┘  └────────────────┘  └────────────┘ │
└───────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
├── app/                  # Next.js App Router Pages
│   ├── actions/          # Server Actions (Auth, Deletions)
│   ├── api/              # Route Handlers (/api/analyze, /api/reports)
│   ├── components/       # Layouts and Global Buttons
│   ├── dashboard/        # Main Metrics Screen
│   ├── upload/           # Drag-and-drop Visualizer Screen
│   ├── analysis/         # Analytics Recharts and Audio Slices
│   ├── history/          # Historical Task list
│   └── settings/         # Themes, Profiles and Danger Zone
├── backend/              # Python FastAPI Service
│   ├── main.py           # Web API Entry
│   ├── vad_engine.py     # Silero VAD Inference & Metrics
│   ├── audio_exporter.py # WAV Segment Splicer
│   ├── report_generator.py # PDF/Word document compiler
│   ├── test_backend.py   # Synthesized pipeline unit tests
│   └── requirements.txt  # Python packages config
├── data/                 # Shared local database & files (Auto-generated)
│   ├── db.json           # JSON Database file
│   ├── uploads/          # Temporary raw uploads
│   └── reports/          # Compiled folders by Analysis ID
├── backend.Dockerfile    # FastAPI build image configuration
├── frontend.Dockerfile   # Next.js build image configuration
└── docker-compose.yml    # Docker Compose multi-service orchestrator
```

---

## Local Setup Instructions

### Backend (Python)

1. Navigate to the project root directory.
2. Initialize a Python virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows PowerShell**: `.\venv\Scripts\Activate.ps1`
   - **macOS/Linux**: `source venv/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
5. Launch the FastAPI server in hot-reload mode:
   ```bash
   python backend/main.py
   ```
   The backend will run on `http://localhost:8000`.

### Frontend (Next.js)

1. Install Node.js packages:
   ```bash
   npm install
   ```
2. Launch the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend application will be hosted on `http://localhost:3000`.

---

## Docker Execution Guide

To build and launch the frontend and backend together in a production-ready Docker Compose environment:

1. Ensure Docker Desktop is installed and running.
2. Navigate to the project root directory and build:
   ```bash
   docker-compose up --build
   ```
3. Once completed, visit `http://localhost:3000` to access the platform.
4. The local `./data` folder will sync dynamic uploads and generated PDF/ZIP reports between the container directories and your host system.

---

## Testing

To run automated checks on the Python VAD, audio segmentation, and PDF/Word generation pipeline:

1. Activate the Python virtual environment.
2. Execute the backend test suite:
   ```bash
   python backend/test_backend.py
   ```
   This script synthesizes a mock 10-second audio wav, executes speech boundaries extraction, compiles report archives, and verifies document sizes automatically.
# vad_detail
