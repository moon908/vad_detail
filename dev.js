const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\x1b[36m%s\x1b[0m', 'Starting VAD Analysis Platform Developer Environment...');

// Determine Python path
let pythonPath = 'python';
const isWindows = process.platform === 'win32';

const venvPath = isWindows 
  ? path.join(__dirname, 'venv', 'Scripts', 'python.exe')
  : path.join(__dirname, 'venv', 'bin', 'python');

if (fs.existsSync(venvPath)) {
  pythonPath = venvPath;
  console.log('\x1b[32m%s\x1b[0m', `Using virtual environment Python: ${pythonPath}`);
} else {
  console.log('\x1b[33m%s\x1b[0m', 'WARNING: "venv" folder not found in project root. Falling back to global "python".');
  console.log('\x1b[33m%s\x1b[0m', 'Please ensure you have created and activated the virtual environment if dependencies are missing.');
}

// Spawn Backend (FastAPI) - run unbuffered using '-u' to stream logs in real-time
const backend = spawn(pythonPath, ['-u', path.join('backend', 'main.py')], {
  stdio: ['inherit', 'pipe', 'pipe']
});

// Spawn Frontend (Next.js) - execute next dev directly via Node to avoid shell dependencies and warnings
const nextCliPath = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
const frontend = spawn(process.execPath, [nextCliPath, 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe']
});

// Helper to format output logs with prefixes
function formatLog(stream, prefix, color) {
  stream.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${color}[${prefix}]\x1b[0m ${line}`);
      }
    });
  });
}

formatLog(backend.stdout, 'FastAPI', '\x1b[35m'); // Magenta
formatLog(backend.stderr, 'FastAPI-Err', '\x1b[31m'); // Red

formatLog(frontend.stdout, 'Next.js', '\x1b[34m'); // Blue
formatLog(frontend.stderr, 'Next.js-Err', '\x1b[31m'); // Red

// Clean exit handling
let isCleaningUp = false;
function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('\x1b[36m%s\x1b[0m', '\nShutting down dev servers...');
  try {
    backend.kill();
  } catch (e) {}
  try {
    frontend.kill();
  } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
