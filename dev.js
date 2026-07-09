const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\x1b[36m%s\x1b[0m', 'Starting VAD Analysis Platform Developer Environment...');

// Spawn Frontend (Next.js) - execute next dev directly via Node to avoid shell dependencies and warnings
const nextCliPath = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
const frontend = spawn(process.execPath, [nextCliPath, 'dev', '--webpack'], {
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

formatLog(frontend.stdout, 'Next.js', '\x1b[34m'); // Blue
formatLog(frontend.stderr, 'Next.js-Err', '\x1b[31m'); // Red

// Clean exit handling
let isCleaningUp = false;
function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('\x1b[36m%s\x1b[0m', '\nShutting down Next.js dev server...');
  try {
    frontend.kill();
  } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

